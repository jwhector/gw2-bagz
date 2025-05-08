import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type {
  ProcessedItemData,
  ProcessedSourceItemData,
} from "../api/lib/types";

export default function SourceItemDivergingBarChart({
  data,
}: {
  data: ProcessedItemData;
}) {
  const { sourceItems, resultItems } = data;

  const gRect = useRef(null);

  const sourceItemsArray = Object.values(sourceItems);
  const sortedData = d3.sort(sourceItemsArray, (a, b) => b.profit - a.profit);
  const barHeight = 25;
  const marginTop = 30;
  const marginRight = 60;
  const marginBottom = 10;
  const marginLeft = 60;
  const height =
    Math.ceil((sortedData.length + 0.1) * barHeight) + marginTop + marginBottom;
  const width = 700;

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(d3.extent(sortedData, (d) => d.profit) as [number, number])
        .rangeRound([marginLeft, width - marginRight]),
    [sortedData]
  );

  const y = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(sortedData.map((d) => d.name))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.15),
    [sortedData, height]
  );

  useEffect(() => {
    if (!gRect.current) return;

    d3.select(gRect.current)
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
      .attr("fill", (d) => (d.profit > 0 ? "green" : "red"))
      .attr("x", () => x(0))
      .attr("y", (d) => y(d.name)!)
      .attr("width", 0)
      .attr("height", y.bandwidth());

    d3.select(gRect.current)
      .selectAll("clipPath")
      .data(sortedData)
      .join("clipPath")
      .attr("id", (d) => `circleClip-${d.id}`)
      .selectAll("circle")
      .data(sortedData)
      .join("circle")
      .attr("cx", () => x(0) - 2)
      .attr("cy", (d) => y(d.name)! + 10)
      .attr("r", 9);

    d3.select(gRect.current)
      .selectAll("image")
      .data(sortedData)
      .join("image")
      .attr("href", (d) => d.icon)
      .attr("x", () => x(0) - 12.5)
      .attr("y", (d) => y(d.name)!)
      .attr("height", 20)
      .attr("width", 20)
      .attr("clip-path", (d) => `url(#circleClip-${d.id})`);
  }, [sortedData, x, y]);

  useEffect(() => {
    if (!gRect.current) return;

    const t = d3.select(gRect.current).transition().duration(750);

    d3.select(gRect.current)
      .selectAll("rect")
      .transition(t)
      .attr("x", (d) =>
        x(Math.min((d as ProcessedSourceItemData).profit, 0))
      )
      .attr("width", (d) =>
        Math.abs(
          x((d as ProcessedSourceItemData).profit) - x(0)
        )
      );
  }, [sortedData, x, y]);

  return (
    <svg width={width} height={height}>
      <g ref={gRect}></g>
    </svg>
  );
}
