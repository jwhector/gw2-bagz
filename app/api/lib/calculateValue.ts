import type { ProcessedSourceItemData } from "./types";
import { getCombinedItemData } from "./fetchItems";

export async function getMarketValue() {
  const { sourceItems, resultItems } = await getCombinedItemData();

  for (const sourceItem of Object.values(sourceItems as Record<number, ProcessedSourceItemData>)) {
    let totalValueContribution = 0;
    sourceItem.contents = sourceItem.contents.map((item) => {
      const itemPrice = resultItems[item.id].sells.unit_price;
      const dropRate = item.quantity / sourceItem.sampleSize;
      const valueContribution = dropRate * itemPrice * 0.85;
      totalValueContribution += valueContribution;
      return {
        ...item,
        ...resultItems[item.id],
        dropRate,
        valueContribution,
      };
    });
    sourceItem.contents.forEach((item) => {
      item.valueContributionPercentage = item.valueContribution / totalValueContribution;
    });

    sourceItem.contentsValue = totalValueContribution;
    sourceItem.containerValue = sourceItem.sells.unit_price * 0.85;
    sourceItem.profitFromBuyOrder = sourceItem.contentsValue - sourceItem.buys.unit_price;
    sourceItem.profitFromSellOrder = sourceItem.contentsValue - sourceItem.sells.unit_price;
    sourceItem.profitMarginFromBuy = sourceItem.profitFromBuyOrder / sourceItem.contentsValue;
  }

  return { sourceItems: sourceItems as Record<number, ProcessedSourceItemData>, resultItems };
}
