import type { SourceItemDataWithContents, GW2PriceData } from "./types";
import { getCombinedItemData } from "./fetchItems";

export async function getMarketValue() {
  const { sourceItems, resultItems } = await getCombinedItemData();

  for (const sourceItem of Object.values(sourceItems as Record<number, SourceItemDataWithContents & GW2PriceData>)) {
    let totalValueContribution = 0;
    sourceItem.contents = sourceItem.contents.map((item) => {
      const itemPrice = resultItems[item.id].sells.unit_price;
      const dropRate = item.quantity / sourceItem.sampleSize;
      const valueContribution = dropRate * itemPrice;
      totalValueContribution += valueContribution;
      return {
        ...item,
        // ...resultItems[item.id],
        dropRate,
        valueContribution,
      };
    });
    sourceItem.valueFromContents = totalValueContribution * 0.85;
    sourceItem.value = sourceItem.sells.unit_price * 0.85;
    sourceItem.profit = sourceItem.valueFromContents - sourceItem.value;
    sourceItem.profitMargin = sourceItem.profit / sourceItem.value;
  }

  return { sourceItems: sourceItems as Record<number, SourceItemDataWithContents & GW2PriceData>, resultItems };
}
