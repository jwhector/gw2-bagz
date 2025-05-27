import SourceItemDivergingBarChart from "../SourceItemDivergingBarChart";
import type { ProcessedItemData } from "../../api/lib/types";
import { useEffect, useRef, useState } from "react";

interface OverviewPageProps {
  data: ProcessedItemData;
  onSourceItemClick: (sourceItemId: number) => void;
}

export default function OverviewPage({
  data,
  onSourceItemClick,
}: OverviewPageProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(700);

  useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.offsetWidth;
        // Subtract padding from the chart container (p-3 sm:p-4 = 12px/16px on each side)
        const availableWidth = containerWidth - 24; // 12px * 2 for mobile
        setChartWidth(Math.max(400, Math.min(availableWidth, 800))); // Min 400px, max 1200px
      }
    };

    updateChartWidth();
    window.addEventListener("resize", updateChartWidth);

    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-3 pb-8 gap-6 sm:p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section on Background */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-2">
          Item Profit Analysis
        </h1>
        <p className="text-slate-300 text-lg sm:text-xl">
          Diverging bar chart showing profit margins from buy orders
        </p>
        <div className="mt-3 mx-auto h-1 w-24 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
      </div>

      {/* Legend/Info Section */}
      <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-400 rounded-sm shadow-sm"></div>
          <span>Profitable Items</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded-sm shadow-sm"></div>
          <span>Loss-making Items</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-500 rounded-sm shadow-sm"></div>
          <span>Hover for detailed breakdown</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full max-w-6xl">
        <div
          ref={chartContainerRef}
          className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-slate-900/50 hover:shadow-2xl hover:bg-slate-800/90"
        >
          <SourceItemDivergingBarChart
            data={data}
            onSourceItemClick={onSourceItemClick}
            width={chartWidth}
          />
        </div>
      </div>
    </div>
  );
}
