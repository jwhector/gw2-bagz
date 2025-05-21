"use client";
import { useEffect, useState } from "react";
import SourceItemDivergingBarChart from "./components/SourceItemDivergingBarChart";
import type { ProcessedItemData } from "./api/lib/types";
import ResultItemBarChart from "./components/ResultItemBarChart";
import ResultItemScatterPlot from "./components/ResultItemScatterPlot";

export default function Home() {
  const [data, setData] = useState<ProcessedItemData | null>(null);
  const [sourceItemId, setSourceItemId] = useState<number | null>(null);

  const onSourceItemClick = (sourceItemId: number) => {
    console.log("Source item clicked:", sourceItemId);
    setSourceItemId(sourceItemId);
  };

  useEffect(() => {
    fetch("http://localhost:3000/api/items/test").then((res) => {
      if (res.ok) {
        res.json().then(setData);
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-6 pb-20 gap-12 sm:p-16 font-[family-name:var(--font-geist-sans)]">
      {data && (
        <SourceItemDivergingBarChart
          data={data}
          onSourceItemClick={onSourceItemClick}
        />
      )}
      {data && sourceItemId && (
        <ResultItemBarChart sourceItemData={data.sourceItems[sourceItemId]} />
      )}
      {data && sourceItemId && (
        <ResultItemScatterPlot
          sourceItemData={data.sourceItems[sourceItemId]}
        />
      )}
    </div>
  );
}
