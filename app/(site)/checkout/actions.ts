"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE } from "@/lib/cart";
import { getCart } from "@/lib/cart-server";
import { generateAccessToken, generateOrderNumber } from "@/lib/orders";
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

/** Loose on purpose — the real test of an address is whether the courier finds it. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

/** Accepts the shapes Filipino numbers are actually written in. */
function looksLikePhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");

  return digits.length >= 7 && digits.length <= 15;
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

    const orderNumber = await generateOrderNumber();
    token = generateAccessToken();

    await prisma.order.create({
      data: {
        orderNumber,
        accessToken: token,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone,
        ...address,
        deliveryNotes: text(formData, "deliveryNotes") || null,
        subtotal: cart.subtotal,
        shippingFee: resolved.fee,
        total: cart.subtotal + resolved.fee,
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
