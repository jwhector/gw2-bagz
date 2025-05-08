"use client";
import { useEffect, useState } from "react";
import { getMarketValue } from "./api/lib/calculateValue";
import SourceItemDivergingBarChart from "./components/SourceItemDivergingBarChart";
import type { ProcessedItemData } from "./api/lib/types";
import SourceItemSunburstChart from "./components/SourceItemSunburstChart";

export default function Home() {
  const [data, setData] = useState<ProcessedItemData | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/items/test").then((res) => {
      if (res.ok) {
        res.json().then(setData);
      }
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      { data && <SourceItemDivergingBarChart data={data} /> }
      { data && <SourceItemSunburstChart data={data} sourceItemId={8920} /> }
    </div>
  );
}
