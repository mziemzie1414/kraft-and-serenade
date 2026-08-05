"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { getCart } from "@/lib/cart-server";
import { looksLikeEmail, looksLikePhone } from "@/lib/customer";
import { getCustomer } from "@/lib/customer-auth";
import { saveOrderAddress } from "@/lib/customer-queries";
import {
  parseIsoDate,
  resolveDelivery,
  toIsoDate,
  todayInShopZone,
} from "@/lib/delivery";
import { getDelivery } from "@/lib/delivery-queries";
import { sendOrderPlacedEmails } from "@/lib/order-emails";
import { getStore } from "@/lib/store";
import { generateAccessToken, generateOrderNumber } from "@/lib/order-queries";
import { createQrPhPayment, isPaymongoConfigured } from "@/lib/paymongo";
import { prisma } from "@/lib/prisma";
import { getShipping } from "@/lib/shipping-queries";
import { resolveShippingFee } from "@/lib/shipping";

export type CheckoutState = {
  status: "idle" | "error";
  message?: string;
  /** Which field to point at, when it is one field's fault. */
  field?: string;
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function required(formData: FormData, name: string, label: string): string {
  const value = text(formData, name);

  if (!value) throw new FieldError(`${label} is required.`, name);

  return value;
}

class FieldError extends Error {
  field: string;

  constructor(message: string, field: string) {
    super(message);
    this.field = field;
  }
}

export async function placeOrder(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  let token: string;

  try {
    /**
     * The cart is re-read from the cookie and re-priced from the database here.
     * Nothing about money comes from the form — the browser can say what it is
     * buying, never what it costs.
     */
    const cart = await getCart();

    if (cart.items.length === 0) {
      throw new FieldError("Your cart is empty.", "");
    }

    /**
     * Read from the session cookie, never from the form. A hidden `customerId`
     * would let anybody attach their order to somebody else's account — and read
     * that account's other orders is not the risk, but writing into its history is.
     *
     * `null` here is the normal case: guests can order, and always could.
     */
    const customer = await getCustomer();

    const customerName = required(formData, "customerName", "Name");
    const customerEmail = required(formData, "customerEmail", "Email");
    const customerPhone = required(formData, "customerPhone", "Phone number");

    if (!looksLikeEmail(customerEmail)) {
      throw new FieldError("That email does not look right.", "customerEmail");
    }

    if (!looksLikePhone(customerPhone)) {
      throw new FieldError("That phone number does not look right.", "customerPhone");
    }

    const regionCode = required(formData, "regionCode", "Region");
    const cityCode = required(formData, "cityCode", "City or municipality");

    const address = {
      regionCode,
      regionName: required(formData, "regionName", "Region"),
      // Provinces are absent for regions like NCR, so these stay optional.
      provinceCode: text(formData, "provinceCode"),
      provinceName: text(formData, "provinceName"),
      cityCode,
      cityName: required(formData, "cityName", "City or municipality"),
      barangay: required(formData, "barangay", "Barangay"),
      street: required(formData, "street", "Street address"),
      postalCode: text(formData, "postalCode"),
    };

    const method = text(formData, "paymentMethod");

    if (method !== "MANUAL" && method !== "PAYMONGO_QRPH") {
      throw new FieldError("Choose how you would like to pay.", "paymentMethod");
    }

    // Resolved again on the server from the submitted codes, so a tampered form
    // cannot lower the delivery charge.
    const shipping = await getShipping();
    const resolved = resolveShippingFee(shipping, { regionCode, cityCode });

    /**
     * The delivery date is re-checked against the live rules and the surcharge
     * recalculated. The form supplies a date and nothing else — not whether it is
     * available, and not what it costs.
     *
     * `todayInShopZone()` is read here rather than taken from the browser, so a
     * wound-back clock cannot buy a same-day slot the shop has closed.
     *
     * Re-checking also catches the honest case: the admin closing a day while
     * somebody had the checkout page open on it.
     */
    const delivery = await getDelivery();
    const resolvedDate = resolveDelivery(
      delivery,
      text(formData, "deliveryDate"),
      todayInShopZone(),
    );

    if (!resolvedDate.ok) {
      throw new FieldError(resolvedDate.reason, "deliveryDate");
    }

    if (method === "PAYMONGO_QRPH" && !isPaymongoConfigured()) {
      throw new FieldError(
        "Card and QR Ph payment is not available right now.",
        "paymentMethod",
      );
    }

    const orderNumber = await generateOrderNumber();
    token = generateAccessToken();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        accessToken: token,
        customerId: customer?.id ?? null,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone,
        ...address,
        deliveryNotes: text(formData, "deliveryNotes") || null,
        // Stored as a `@db.Date`, so it has to go in as UTC midnight — see the
        // note at the top of lib/delivery.ts.
        deliveryDate: resolvedDate.date ? parseIsoDate(resolvedDate.date) : null,
        subtotal: cart.subtotal,
        shippingFee: resolved.fee,
        rushFee: resolvedDate.rushFee,
        total: cart.subtotal + resolved.fee + resolvedDate.rushFee,
        shippingBasis: resolved.basis,
        shippingLabel: resolved.label,
        paymentMethod: method,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productSlug: item.slug,
            imageUrl: item.imageUrl,
            unitPrice: item.price,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    // The order now owns the contents, so the cart is done with.
    (await cookies()).delete(CART_COOKIE);

    /**
     * Keep the address, if there is an account to keep it on and the customer
     * asked. Done after the order rather than before, so a failure here cannot
     * cost them the order — which is why it is in its own try.
     */
    if (customer && text(formData, "saveAddress") === "on") {
      try {
        await saveOrderAddress(customer.id, {
          ...address,
          deliveryNotes: text(formData, "deliveryNotes") || null,
        });
      } catch (addressError) {
        console.error("Could not save the delivery address", addressError);
      }
    }

    /**
     * The QR code is generated after the order exists, not before, so a PayMongo
     * outage cannot lose an order that the customer has already confirmed. If this
     * fails they land on the confirmation page and can generate the code there.
     */
    if (method === "PAYMONGO_QRPH") {
      try {
        const payment = await createQrPhPayment({
          amountPesos: order.total,
          description: order.orderNumber,
          // Keyed on the order, so a retry returns the same intent.
          idempotencyKey: `order-${order.id}`,
          metadata: { orderNumber: order.orderNumber, orderId: order.id },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymongoPaymentIntentId: payment.paymentIntentId,
            qrCodeImage: payment.qrImage,
            qrExpiresAt: payment.expiresAt,
          },
        });
      } catch (paymentError) {
        console.error("Could not create the QR Ph payment", paymentError);
      }
    }

    /**
     * Confirmation to the customer and an alert to the shop.
     *
     * Scheduled with `after` rather than awaited: the customer should not wait on
     * a mail provider to learn their order went through, and the two requests are
     * bounded at eight seconds each. `after` still runs when the action ends in a
     * `redirect()`, which this one does, and unlike a dangling promise it survives
     * the response being sent on serverless.
     *
     * Its own try/catch as well, so nothing in here can turn a placed order into
     * an error the customer sees.
     */
    const placed = order;

    after(async () => {
      try {
        await sendOrderPlacedEmails(
          {
            id: placed.id,
            orderNumber: placed.orderNumber,
            accessToken: placed.accessToken,
            customerName: placed.customerName,
            customerEmail: placed.customerEmail,
            customerPhone: placed.customerPhone,
            regionName: placed.regionName,
            provinceName: placed.provinceName,
            cityName: placed.cityName,
            barangay: placed.barangay,
            street: placed.street,
            postalCode: placed.postalCode,
            deliveryNotes: placed.deliveryNotes,
            // Back to a plain `YYYY-MM-DD` for the email, which never handles a Date.
            deliveryDate: placed.deliveryDate
              ? toIsoDate(placed.deliveryDate)
              : null,
            subtotal: placed.subtotal,
            shippingFee: placed.shippingFee,
            rushFee: placed.rushFee,
            total: placed.total,
            shippingBasis: placed.shippingBasis,
            shippingLabel: placed.shippingLabel,
            paymentMethod: placed.paymentMethod,
            items: cart.items.map((item) => ({
              productName: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              lineTotal: item.lineTotal,
            })),
          },
          // Read here rather than above, so the order path does not pay for it.
          await getStore(),
        );
      } catch (emailError) {
        console.error("Could not send the order emails", emailError);
      }
    });
  } catch (error) {
    if (error instanceof FieldError) {
      return { status: "error", message: error.message, field: error.field };
    }

    console.error("Order could not be placed", error);

    return {
      status: "error",
      message: "Something went wrong placing your order. Please try again.",
    };
  }

  // Outside the try: redirect works by throwing.
  redirect(`/orders/${token}`);
}


