export interface GW2ItemData {
  name: string;
  type: string;
  level: number;
  rarity: string;
  vendor_value: number;
  game_types: string[];
  flags: string[];
  restrictions: string[];
  id: number;
  chat_link: string;
  icon: string;
  isSourceItem: boolean;
}

export interface ResultItemData extends GW2ItemData {
  isSourceItem: false;
}

export interface SourceItemData extends GW2ItemData {
  isSourceItem: true;
  sampleSize: number;
  isSalvageable: boolean;
  contents: {
    id: number;
    quantity: number;
  }[];
}

export interface GW2PriceData {
  id: number;
  whitelisted: boolean;
  buys: {
    quantity: number;
    unit_price: number;
  };
  sells: {
    quantity: number;
    unit_price: number;
  };
}

export interface SourceItemContents extends GW2ItemData, GW2PriceData {
  quantity: number;
  dropRate: number;
  valueContribution: number;
  valueContributionPercentage: number;
}

export interface SourceItemDataWithContents extends SourceItemData {
  contents: SourceItemContents[];
  contentsValue: number;
  containerValue: number;
  profitFromBuyOrder: number;
  profitFromSellOrder: number;
  profitMarginFromBuy: number;
  profitMarginFromSell: number;
}

export interface ProcessedSourceItemData
  extends SourceItemDataWithContents,
    GW2PriceData {}

export interface ProcessedResultItemData extends ResultItemData, GW2PriceData {}

export interface ProcessedItemData {
  sourceItems: Record<number, ProcessedSourceItemData>;
  resultItems: Record<number, ProcessedResultItemData>;
}
