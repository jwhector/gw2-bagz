import ResultItemBarChart from "../ResultItemBarChart";
import ResultItemScatterPlot from "../ResultItemScatterPlot";
import type { ProcessedItemData } from "../../api/lib/types";
import Image from "next/image";

interface BreakdownPageProps {
  data: ProcessedItemData;
  sourceItemId: number;
  onBackToOverview: () => void;
}

export default function BreakdownPage({
  data,
  sourceItemId,
  onBackToOverview,
}: BreakdownPageProps) {
  const sourceItem = data.sourceItems[sourceItemId];

  // Helper function to format copper values to gold/silver/copper
  const formatCurrency = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemainder = copper % 100;

    if (gold > 0) {
      return `${gold}g ${silver}s ${copperRemainder}c`;
    } else if (silver > 0) {
      return `${silver}s ${copperRemainder}c`;
    } else {
      return `${copperRemainder}c`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with back button */}
      <div className="p-6 border-b">
        <button
          onClick={onBackToOverview}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Overview
        </button>
      </div>

      {/* Main breakdown layout */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left sidebar - Source item stats */}
        <div className="w-1/3 p-6 border-r bg-gray-50 fixed left-0 top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
          {/* Item Header with Icon and Name */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <Image
                src={sourceItem.icon}
                alt={sourceItem.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg shadow-md"
              />
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  sourceItem.rarity === "Exotic"
                    ? "bg-orange-500"
                    : sourceItem.rarity === "Rare"
                    ? "bg-yellow-500"
                    : sourceItem.rarity === "Masterwork"
                    ? "bg-green-500"
                    : sourceItem.rarity === "Fine"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
              ></div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 leading-tight">
                {sourceItem.name}
              </h3>
              <p className="text-sm text-gray-600 capitalize font-medium">
                {sourceItem.rarity}
              </p>
            </div>
          </div>

          {/* Trading Post Values */}
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-800">
                  Buy Orders
                </span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(sourceItem.buys.unit_price)}
                </span>
              </div>
              <div className="text-xs text-green-600">
                {sourceItem.buys.quantity.toLocaleString()} available
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-800">
                  Sell Orders
                </span>
                <span className="text-lg font-bold text-red-700">
                  {formatCurrency(sourceItem.sells.unit_price)}
                </span>
              </div>
              <div className="text-xs text-red-600">
                {sourceItem.sells.quantity.toLocaleString()} available
              </div>
            </div>
          </div>

          {/* Expected Value */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-800">
                Expected Value
              </span>
              <span className="text-lg font-bold text-purple-700">
                {formatCurrency(sourceItem.contentsValue)}
              </span>
            </div>
            <div className="text-xs text-purple-600">
              From opening container
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 shadow-sm">
              <div className="text-xs font-medium text-blue-800 mb-1">
                Profit (Buy)
              </div>
              <div
                className={`text-sm font-bold ${
                  sourceItem.profitFromBuyOrder >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {sourceItem.profitFromBuyOrder >= 0 ? "+" : ""}
                {formatCurrency(sourceItem.profitFromBuyOrder)}
              </div>
              <div className="text-xs text-blue-600">
                {sourceItem.profitMarginFromBuy}% margin
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 shadow-sm">
              <div className="text-xs font-medium text-orange-800 mb-1">
                Profit (Sell)
              </div>
              <div
                className={`text-sm font-bold ${
                  sourceItem.profitFromSellOrder >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {sourceItem.profitFromSellOrder >= 0 ? "+" : ""}
                {formatCurrency(sourceItem.profitFromSellOrder)}
              </div>
              <div className="text-xs text-orange-600">
                {sourceItem.profitMarginFromSell}% margin
              </div>
            </div>
          </div>

          {/* Container Contents Count */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Container Contents
              </span>
              <span className="text-lg font-bold text-gray-800">
                {sourceItem.contents.length} items
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Sample size: {sourceItem.sampleSize.toLocaleString()} containers
            </div>
          </div>
        </div>

        {/* Right content - Container contents */}
        <div className="flex-1 p-6 ml-[33.333333%] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Container Contents</h2>
          <div className="space-y-6">
            <ResultItemBarChart
              sourceItemData={data.sourceItems[sourceItemId]}
            />
            <ResultItemScatterPlot
              sourceItemData={data.sourceItems[sourceItemId]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
