import { PrismaClient } from "@prisma/client";
import { GW2ItemData, GW2PriceData, ResultItemData, SourceItemData } from "./types";

const prisma = new PrismaClient();
const gw2ApiUrl = "https://api.guildwars2.com/v2/";

// Function to fetch GW2 item data
async function fetchGw2Items(itemIds: number[]): Promise<GW2ItemData[]> {
  if (itemIds.length === 0) return [];
  const response = await fetch(`${gw2ApiUrl}items?ids=${itemIds.join(",")}`);
  if (!response.ok) throw new Error("Failed to fetch GW2 items");
  return response.json();
}

// Function to fetch GW2 price data
async function fetchGw2Prices(itemIds: number[]): Promise<GW2PriceData[]> {
  if (itemIds.length === 0) return [];
  const response = await fetch(
    `${gw2ApiUrl}commerce/prices?ids=${itemIds.join(",")}`
  );
  if (!response.ok) throw new Error("Failed to fetch GW2 prices");
  return response.json();
}

// Retrieve complete item data from the database and the GW2 API
export async function getCombinedItemData() {
  const allSourceItems = await prisma.sourceItem.findMany({
    include: {
      dropRecords: true,
    },
  });
  const allResultItems = await prisma.resultItem.findMany({});
  const allItemIds = [
    ...allSourceItems.map((item) => item.id),
    ...allResultItems.map((item) => item.id),
  ];

  const [gw2ItemsApiData, gw2PricesApiData] = await Promise.all([
    fetchGw2Items(allItemIds),
    fetchGw2Prices(allItemIds),
  ]);

  const sourceItemRecord: Record<number, SourceItemData & GW2PriceData> = {};
  const resultItemRecord: Record<number, ResultItemData & GW2PriceData> = {};

  allSourceItems.forEach((item) => {
    const itemPriceData = gw2PricesApiData.find(
      (priceData) => priceData.id === item.id
    );
    const itemGw2Data = gw2ItemsApiData.find(
      (itemData) => itemData.id === item.id
    );

    if (!itemPriceData) {
      throw new Error(`Item ${item.id} missing price data`);
    }

    if (!itemGw2Data) {
      throw new Error(`Item ${item.id} not found in GW2 API`);
    }

    sourceItemRecord[item.id] = {
      ...itemGw2Data,
      ...itemPriceData,
      sampleSize: item.sampleSize,
      isSourceItem: true,
      isSalvageable: item.type === "SALVAGEABLE",
      contents: item.dropRecords.map((record) => ({
        id: record.resultItemId,
        quantity: record.totalQuantity,
      })),
    };
  });

  allResultItems.forEach((item) => {
    const itemPriceData = gw2PricesApiData.find(
      (priceData) => priceData.id === item.id
    );
    const itemGw2Data = gw2ItemsApiData.find(
      (itemData) => itemData.id === item.id
    );

    if (!itemPriceData) {
      throw new Error(`Item ${item.id} missing price data`);
    }

    if (!itemGw2Data) {
      throw new Error(`Item ${item.id} not found in GW2 API`);
    }

    resultItemRecord[item.id] = {
      ...itemGw2Data,
      ...itemPriceData,
      isSourceItem: false,
    };
  });

  return {
    sourceItems: sourceItemRecord,
    resultItems: resultItemRecord,
  };
}
