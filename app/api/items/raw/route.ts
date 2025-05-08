import { getCombinedItemData } from "@/app/api/lib/fetchItems";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { sourceItems, resultItems } = await getCombinedItemData();
    
    return NextResponse.json({
      sourceItems,
      resultItems,
    });
  } catch (err) {
    console.error("/api/items/raw - Error fetching item info:", err);
    return NextResponse.json(
      { error: "Failed to fetch item data" },
      { status: 500 }
    );
  }
}
