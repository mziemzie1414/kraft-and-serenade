/**
 * Philippine Standard Geographic Code lookups, via https://psgc.cloud.
 *
 * No key or sign-up needed, but the maintainers ask that consumers cache
 * results, so every call sets a long `revalidate`. This is reference data that
 * changes when the PSA publishes a new release — days-old copies are fine.
 *
 * Two quirks of the upstream data are handled here:
 *
 * - Some regions have no provinces (NCR returns an empty array), so cities have
 *   to be fetched from the region instead.
 * - City payloads carry a `province` field that is wrong for NCR, so it is
 *   ignored entirely.
 */

const BASE = "https://psgc.cloud/api/v2";

/** A day. The PSGC changes on PSA release cycles, not on our schedule. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

export type PsgcPlace = { code: string; name: string };

export type PsgcCity = PsgcPlace & {
  /** "City", "Mun", or "SubMun" upstream. */
  type: string;
  /** Often blank upstream, which is why postal code stays editable. */
  zipCode: string;
};

type ApiPlace = { code?: unknown; name?: unknown };
type ApiCity = ApiPlace & { type?: unknown; zip_code?: unknown };

async function get<T>(path: string): Promise<T[]> {
  const response = await fetch(`${BASE}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`PSGC request failed (${response.status}) for ${path}`);
  }

  const body: unknown = await response.json();
  const data = (body as { data?: unknown })?.data;

  return Array.isArray(data) ? (data as T[]) : [];
}

function toPlace(row: ApiPlace): PsgcPlace | null {
  const code = typeof row.code === "string" ? row.code : "";
  const name = typeof row.name === "string" ? row.name : "";

  return code && name ? { code, name } : null;
}

function byName(a: PsgcPlace, b: PsgcPlace) {
  return a.name.localeCompare(b.name);
}

export async function listRegions(): Promise<PsgcPlace[]> {
  const rows = await get<ApiPlace>("/regions");

  return rows
    .map(toPlace)
    .filter((row): row is PsgcPlace => row !== null)
    .sort(byName);
}

/** Empty for regions that have none, such as NCR. */
export async function listProvinces(regionCode: string): Promise<PsgcPlace[]> {
  if (!regionCode) return [];

  const rows = await get<ApiPlace>(`/regions/${regionCode}/provinces`);

  return rows
    .map(toPlace)
    .filter((row): row is PsgcPlace => row !== null)
    .sort(byName);
}

/**
 * Cities and municipalities for a province, or for a region when that region has
 * no provinces.
 *
 * Sub-municipalities are dropped: they are districts of Manila, and listing them
 * next to "City of Manila" makes the choice ambiguous for both the customer and
 * the shipping rate that keys off it. The barangay field covers that detail.
 */
export async function listCities(options: {
  regionCode?: string;
  provinceCode?: string;
}): Promise<PsgcCity[]> {
  const path = options.provinceCode
    ? `/provinces/${options.provinceCode}/cities-municipalities`
    : options.regionCode
      ? `/regions/${options.regionCode}/cities-municipalities`
      : null;

  if (!path) return [];

  const rows = await get<ApiCity>(path);

  return rows
    .map((row) => {
      const place = toPlace(row);
      if (!place) return null;

      const type = typeof row.type === "string" ? row.type : "";

      return {
        ...place,
        type,
        zipCode: typeof row.zip_code === "string" ? row.zip_code : "",
      };
    })
    .filter((row): row is PsgcCity => row !== null && row.type !== "SubMun")
    .sort(byName);
}

/** Looks up one city, for server-side validation of a submitted address. */
export async function findCity(
  cityCode: string,
  options: { regionCode?: string; provinceCode?: string },
): Promise<PsgcCity | null> {
  const cities = await listCities(options);

  return cities.find((city) => city.code === cityCode) ?? null;
}
