"use client";

import { useEffect, useState } from "react";
import type { PsgcCity, PsgcPlace } from "@/lib/psgc";

export type LocationValue = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  /** Filled in from PSGC when known; the caller decides whether to override. */
  zipCode: string;
};

export const EMPTY_LOCATION: LocationValue = {
  regionCode: "",
  regionName: "",
  provinceCode: "",
  provinceName: "",
  cityCode: "",
  cityName: "",
  zipCode: "",
};

async function fetchLevel(query: string): Promise<unknown[]> {
  const response = await fetch(`/api/psgc?${query}`);

  if (!response.ok) throw new Error("lookup failed");

  const body = (await response.json()) as { data?: unknown[] };

  return body.data ?? [];
}

/** A fetched list, tagged with the query it answers. */
type Cache<T> = { key: string; items: T[] };

const EMPTY_CACHE = { key: "", items: [] };

/**
 * Cascading region → province → city/municipality selects backed by PSGC.
 *
 * Names are submitted alongside the codes so an order or saved address stays
 * readable without calling the API again, which also means historical records do
 * not shift if the upstream data is renamed.
 *
 * Not every region has provinces (NCR has none), in which case the province
 * select is hidden and cities load straight from the region.
 *
 * Each list is cached against the query that produced it and the visible options
 * are derived from whether that key still matches. That is what keeps stale
 * options from flashing up without clearing state inside an effect.
 */
export function LocationPicker({
  value,
  onChange,
  idPrefix,
  disabled = false,
  inputClassName,
  labelClassName,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  idPrefix: string;
  disabled?: boolean;
  inputClassName: string;
  labelClassName: string;
}) {
  const [regions, setRegions] = useState<Cache<PsgcPlace>>(EMPTY_CACHE);
  const [provinceCache, setProvinceCache] = useState<Cache<PsgcPlace>>(EMPTY_CACHE);
  const [cityCache, setCityCache] = useState<Cache<PsgcCity>>(EMPTY_CACHE);
  const [failed, setFailed] = useState(false);

  const regionsReady = regions.key === "regions";

  const provinceKey = value.regionCode;
  const provincesReady = Boolean(provinceKey) && provinceCache.key === provinceKey;
  const provinces = provincesReady ? provinceCache.items : [];
  const hasProvinces = provinces.length > 0;

  /**
   * Empty until a city query is actually answerable: a region with provinces
   * needs one picked first, otherwise every city in the region would load.
   */
  const cityKey =
    !provincesReady
      ? ""
      : value.provinceCode
        ? `province:${value.provinceCode}`
        : hasProvinces
          ? ""
          : `region:${value.regionCode}`;

  const citiesReady = Boolean(cityKey) && cityCache.key === cityKey;
  const cities = citiesReady ? cityCache.items : [];

  useEffect(() => {
    let cancelled = false;

    fetchLevel("level=regions")
      .then((data) => {
        if (!cancelled) setRegions({ key: "regions", items: data as PsgcPlace[] });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceKey || provinceCache.key === provinceKey) return;

    let cancelled = false;

    fetchLevel(`level=provinces&region=${provinceKey}`)
      .then((data) => {
        if (!cancelled) {
          setProvinceCache({ key: provinceKey, items: data as PsgcPlace[] });
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [provinceKey, provinceCache.key]);

  useEffect(() => {
    if (!cityKey || cityCache.key === cityKey) return;

    let cancelled = false;
    const [level, code] = cityKey.split(":");
    const query =
      level === "province"
        ? `level=cities&province=${code}`
        : `level=cities&region=${code}`;

    fetchLevel(query)
      .then((data) => {
        if (!cancelled) setCityCache({ key: cityKey, items: data as PsgcCity[] });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [cityKey, cityCache.key]);

  return (
    <div className="space-y-4">
      {failed ? (
        <p className="rounded-lg border border-blush-500 px-3 py-2 text-sm text-blush-600">
          Could not load the location list. Check your connection and try again.
        </p>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-region`} className={labelClassName}>
          Region
        </label>
        <select
          id={`${idPrefix}-region`}
          value={value.regionCode}
          disabled={disabled || !regionsReady}
          onChange={(event) => {
            const code = event.target.value;
            const name = regions.items.find((r) => r.code === code)?.name ?? "";

            // Changing the region invalidates everything below it.
            onChange({ ...EMPTY_LOCATION, regionCode: code, regionName: name });
          }}
          className={`mt-1.5 ${inputClassName}`}
          required
        >
          <option value="">
            {regionsReady ? "Choose a region…" : "Loading…"}
          </option>
          {regions.items.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {/* Hidden for regions without provinces, so nothing looks broken. */}
      {hasProvinces ? (
        <div>
          <label htmlFor={`${idPrefix}-province`} className={labelClassName}>
            Province
          </label>
          <select
            id={`${idPrefix}-province`}
            value={value.provinceCode}
            disabled={disabled}
            onChange={(event) => {
              const code = event.target.value;
              const name = provinces.find((p) => p.code === code)?.name ?? "";

              onChange({
                ...value,
                provinceCode: code,
                provinceName: name,
                cityCode: "",
                cityName: "",
                zipCode: "",
              });
            }}
            className={`mt-1.5 ${inputClassName}`}
            required
          >
            <option value="">Choose a province…</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-city`} className={labelClassName}>
          City or municipality
        </label>
        <select
          id={`${idPrefix}-city`}
          value={value.cityCode}
          disabled={disabled || cities.length === 0}
          onChange={(event) => {
            const code = event.target.value;
            const city = cities.find((c) => c.code === code);

            onChange({
              ...value,
              cityCode: code,
              cityName: city?.name ?? "",
              // PSGC leaves plenty of these blank, so this fills in when it can
              // and otherwise leaves the field for the customer.
              zipCode: city?.zipCode ?? "",
            });
          }}
          className={`mt-1.5 ${inputClassName}`}
          required
        >
          <option value="">
            {!value.regionCode
              ? "Choose a region first"
              : hasProvinces && !value.provinceCode
                ? "Choose a province first"
                : citiesReady
                  ? "Choose a city or municipality…"
                  : "Loading…"}
          </option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* Codes and names both travel with the form. */}
      <input type="hidden" name="regionCode" value={value.regionCode} />
      <input type="hidden" name="regionName" value={value.regionName} />
      <input type="hidden" name="provinceCode" value={value.provinceCode} />
      <input type="hidden" name="provinceName" value={value.provinceName} />
      <input type="hidden" name="cityCode" value={value.cityCode} />
      <input type="hidden" name="cityName" value={value.cityName} />
    </div>
  );
}
