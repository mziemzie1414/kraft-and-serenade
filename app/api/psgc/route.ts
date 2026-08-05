import { NextResponse, type NextRequest } from "next/server";
import { listCities, listProvinces, listRegions } from "@/lib/psgc";

/**
 * Feeds the cascading location dropdowns in the checkout, profile and shipping
 * forms.
 *
 * Going through our own route rather than calling psgc.cloud from the browser
 * keeps their caching request honoured in one place and means the client never
 * has to know the upstream shape.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const level = params.get("level");
  const region = params.get("region") ?? undefined;
  const province = params.get("province") ?? undefined;

  try {
    switch (level) {
      case "regions":
        return NextResponse.json({ data: await listRegions() });

      case "provinces":
        return NextResponse.json({ data: await listProvinces(region ?? "") });

      case "cities":
        return NextResponse.json({
          data: await listCities({ regionCode: region, provinceCode: province }),
        });

      default:
        return NextResponse.json(
          { error: "level must be regions, provinces or cities" },
          { status: 400 },
        );
    }
  } catch (error) {
    // The upstream API is public and occasionally rate limits. Surface that as a
    // 502 so the form can say "could not load" rather than hanging.
    console.error("PSGC lookup failed", error);

    return NextResponse.json(
      { error: "Could not reach the location service." },
      { status: 502 },
    );
  }
}
