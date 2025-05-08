import { NextResponse } from "next/server";
import { getMarketValue } from "../../lib/calculateValue";

export async function GET() {
  try {
    const { sourceItems, resultItems } = await getMarketValue();
    
    return NextResponse.json({
      sourceItems,
      resultItems,
    });
  } catch (err) {
    console.error("/api/items/test - Error fetching item info:", err);
    return NextResponse.json(
      { error: "Failed to fetch item data" },
      { status: 500 }
    );
  }
}
