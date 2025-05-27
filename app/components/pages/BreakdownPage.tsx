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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with back button */}
      <div className="p-4 sm:p-6">
        <button
          onClick={onBackToOverview}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
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
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 pt-0">
        {/* Left sidebar - Source item stats */}
        <div className="lg:w-1/3 lg:max-w-md">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 transition-all duration-300 hover:shadow-slate-900/50 hover:shadow-2xl hover:bg-slate-800/90 sticky top-6">
            {/* Item Header with Icon and Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Image
                  src={sourceItem.icon}
                  alt={sourceItem.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl shadow-lg"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 shadow-sm ${
                    sourceItem.rarity === "Exotic"
                      ? "bg-orange-400"
                      : sourceItem.rarity === "Rare"
                      ? "bg-yellow-400"
                      : sourceItem.rarity === "Masterwork"
                      ? "bg-emerald-400"
                      : sourceItem.rarity === "Fine"
                      ? "bg-blue-400"
                      : "bg-slate-400"
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-100 leading-tight">
                  {sourceItem.name}
                </h3>
                <p className="text-sm text-slate-300 capitalize font-medium">
                  {sourceItem.rarity}
                </p>
              </div>
            </div>

            {/* Trading Post Values */}
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    Buy Orders
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency(sourceItem.buys.unit_price)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {sourceItem.buys.quantity.toLocaleString()} available
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    Sell Orders
                  </span>
                  <span className="text-lg font-bold text-blue-400">
                    {formatCurrency(sourceItem.sells.unit_price)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {sourceItem.sells.quantity.toLocaleString()} available
                </div>
              </div>
            </div>

            {/* Expected Value */}
            <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Expected Value
                </span>
                <span className="text-lg font-bold text-slate-100">
                  {formatCurrency(sourceItem.contentsValue)}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                From opening container
              </div>
            </div>

            {/* Profit Analysis */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Profit (Buy)
                </div>
                <div
                  className={`text-sm font-bold ${
                    sourceItem.profitFromBuyOrder >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {sourceItem.profitFromBuyOrder >= 0 ? "+" : ""}
                  {formatCurrency(sourceItem.profitFromBuyOrder)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {sourceItem.profitMarginFromBuy}% margin
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Profit (Sell)
                </div>
                <div
                  className={`text-sm font-bold ${
                    sourceItem.profitFromSellOrder >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {sourceItem.profitFromSellOrder >= 0 ? "+" : ""}
                  {formatCurrency(sourceItem.profitFromSellOrder)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {sourceItem.profitMarginFromSell}% margin
                </div>
              </div>
            </div>

            {/* Container Contents Count */}
            <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 border border-slate-600/30 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">
                  Container Contents
                </span>
                <span className="text-lg font-bold text-slate-100">
                  {sourceItem.contents.length} items
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Sample size: {sourceItem.sampleSize.toLocaleString()} containers
              </div>
            </div>
          </div>
        </div>

        {/* Right content - Container contents */}
        <div className="flex-1 lg:max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
              Container Contents Analysis
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Detailed breakdown of items found in {sourceItem.name}
            </p>
            <div className="mt-3 mx-auto h-1 w-24 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
          </div>

          {/* Charts Container */}
          <div className="space-y-6">
            {/* Bar Chart Container */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 transition-all duration-300 hover:shadow-slate-900/50 hover:shadow-2xl hover:bg-slate-800/90">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Item Value Distribution
              </h3>
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <ResultItemBarChart
                  sourceItemData={data.sourceItems[sourceItemId]}
                />
              </div>
            </div>

            {/* Scatter Plot Container */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 transition-all duration-300 hover:shadow-slate-900/50 hover:shadow-2xl hover:bg-slate-800/90">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Drop Rate vs Value Analysis
              </h3>
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-slate-600/30 shadow-inner">
                <ResultItemScatterPlot
                  sourceItemData={data.sourceItems[sourceItemId]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
