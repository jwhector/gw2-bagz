"use client";

import { useEffect, useState } from "react";
import { ProcessedSourceItemData } from "../../api/lib/types";
import ResultItemBarChart from "../../components/ResultItemBarChart";
import Image from "next/image";

export default function SourceItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const [sourceItem, setSourceItem] = useState<ProcessedSourceItemData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourceItem = async () => {
      try {
        const response = await fetch("/api/items/test");
        if (!response.ok) {
          throw new Error("Failed to fetch item data");
        }

        const data = await response.json();
        const itemId = parseInt((await params).itemId, 10);
        const foundItem = data.sourceItems[itemId];

        if (!foundItem) {
          throw new Error(`Item with ID ${itemId} not found`);
        }

        setSourceItem(foundItem);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSourceItem();
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!sourceItem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Item not found</div>
      </div>
    );
  }

  // Format price for better readability
  const formatPrice = (price: number) => {
    const absPrice = Math.abs(price)
    const gold = Math.floor(absPrice / 10000);
    const silver = Math.floor((absPrice % 10000) / 100);
    const copper = Math.floor(absPrice % 100);

    return (
      <span className="flex items-center gap-1">
        {price < 0 && (
          <span className="text-red-500">
            -
          </span>
        )}
        {
          gold > 0 && (
            <span className="flex items-center gap-1">
              <span>{gold}</span>
              <span className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600"></span>
            </span>
          )
        }
        {
          silver > 0 && (
            <span className="flex items-center gap-1">
              <span>{silver}</span>
              <span className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400"></span>
            </span>
          )
        }
        {
          copper > 0 && (
            <span className="flex items-center gap-1">
              <span>{copper}</span>
              <span className="w-4 h-4 rounded-full bg-amber-700 border border-amber-800"></span>
            </span>
          )
        }
      </span>
    );
  };

  console.log(sourceItem)

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Source Item Details - 1/3 of the page */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-4 h-fit">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={sourceItem.icon}
              alt={sourceItem.name}
              width={64}
              height={64}
              className="rounded-md border border-gray-600"
            />
            <div>
              <h1 className="text-2xl font-bold">{sourceItem.name}</h1>
              <p className="text-gray-400">
                {sourceItem.rarity} {sourceItem.type}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-gray-700 p-3 rounded-md">
              <div className="text-gray-300">Buy Price:</div>
              <div className="text-right">
                {formatPrice(sourceItem.buys.unit_price)}
              </div>

              <div className="text-gray-300">Sell Price:</div>
              <div className="text-right">
                {formatPrice(sourceItem.sells.unit_price)}
              </div>

              <div className="text-gray-300">Contents Value:</div>
              <div className="text-right">
                {formatPrice(sourceItem.contentsValue)}
              </div>

              <div className="text-gray-300">Sample Size:</div>
              <div className="text-right">{sourceItem.sampleSize} openings</div>
            </div>

            <div className="bg-gray-700 p-3 rounded-md">
              <h2 className="text-xl font-semibold mb-2">Profit Analysis</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-300">Profit from Buy Order:</div>
                <div
                  className={`text-right ${
                    sourceItem.profitFromBuyOrder > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatPrice(sourceItem.profitFromBuyOrder)}
                </div>

                <div className="text-gray-300">Profit from Sell Order:</div>
                <div
                  className={`text-right ${
                    sourceItem.profitFromSellOrder > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatPrice(sourceItem.profitFromSellOrder)}
                </div>

                <div className="text-gray-300">Profit Margin (Buy):</div>
                <div
                  className={`text-right ${
                    sourceItem.profitMarginFromBuy > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {(sourceItem.profitMarginFromBuy * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Item Bar Chart - 2/3 of the page */}
        <div className="col-span-2 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Contents Distribution</h2>
          <ResultItemBarChart sourceItemData={sourceItem} />
        </div>
      </div>
    </div>
  );
}
