"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/ui/Icons";

const PRICE_RANGES = [
  { label: "All prices", value: "" },
  { label: "₱1 – ₱500", value: "1-500" },
  { label: "₱501 – ₱1,000", value: "501-1000" },
  { label: "₱1,001 – ₱1,500", value: "1001-1500" },
  { label: "₱1,501 – ₱2,000", value: "1501-2000" },
  { label: "₱2,000+", value: "2001-" },
] as const;

export function PriceFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPrice = searchParams.get("price") ?? "";

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("price", value);
    } else {
      params.delete("price");
    }

    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentPrice}
        onChange={handleChange}
        aria-label="Filter by price range"
        className="appearance-none rounded-full border border-canvas-deep bg-canvas py-2 pr-9 pl-4 text-sm font-medium text-ink-soft transition-colors duration-300 hover:border-moss-400 hover:text-ink focus:border-moss-400 focus:text-ink focus:outline-none"
      >
        {PRICE_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-soft" />
    </div>
  );
}
