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
  const gName = useRef(null);
  const gValue = useRef(null);
  const gAxis = useRef(null);
  const gImg = useRef(null);

  const sourceItemsArray = Object.values(sourceItems);
  const sortedData = d3.sort(sourceItemsArray, (a, b) => b.profitFromBuyOrder - a.profitFromBuyOrder);
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
        .domain(d3.extent(sortedData, (d) => d.profitFromBuyOrder) as [number, number])
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
    if (!gRect.current || !gImg.current) return;

    d3.select(gRect.current)
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
      .attr("fill", (d) => (d.profitFromBuyOrder > 0 ? "green" : "red"))
      .attr("x", () => x(0))
      .attr("y", (d) => y(d.name)!)
      .attr("width", 0)
      .attr("height", y.bandwidth());

    d3.select(gImg.current)
      .selectAll("clipPath")
      .data(sortedData)
      .join("clipPath")
      .attr("id", (d) => `circleClip-${d.id}`)
      .selectAll("circle")
      .data(sortedData)
      .join("circle")
      .attr("cx", () => x(0) - 2)
      .attr("cy", (d) => y(d.name)! + 10)
      .attr("r", 10);

    d3.select(gImg.current)
      .selectAll("image")
      .data(sortedData)
      .join("image")
      .attr("href", (d) => d.icon)
      .attr("x", () => x(0) - 12.5)
      .attr("y", (d) => y(d.name)!)
      .attr("height", 20)
      .attr("width", 20)
      .attr("clip-path", (d) => `url(#circleClip-${d.id})`);

    d3.select(gName.current)
      .selectAll("text")
      .data(sortedData)
      .join("text")
      .text((d) => d.name)
      .attr("text-anchor", (d) => (d.profitFromBuyOrder > 0 ? "end" : "start"))
      .attr("x", (d) => x(0) + (d.profitFromBuyOrder > 0 ? -15 : 15))
      .attr("y", (d) => y(d.name)! + y.bandwidth() / 2 + y.padding() / 2)
      .attr("dy", "0.35em");

    d3.select(gValue.current)
      .selectAll("text")
      .data(sortedData)
      .join("text")
      .text((d) => d3.format("+.1f")(d.profitFromBuyOrder))
      .attr("text-anchor", (d) => (d.profitFromBuyOrder > 0 ? "start" : "end"))
      .attr("x", (d) => x(d.profitFromBuyOrder) + (d.profitFromBuyOrder > 0 ? 10 : -10))
      .attr("y", (d) => y(d.name)! + y.bandwidth() / 2)
      .attr("dy", "0.35em");

  }, [sortedData, x, y]);

  useEffect(() => {
    if (!gRect.current) return;

    const t = d3.select(gRect.current).transition().duration(750);

    d3.select(gRect.current)
      .selectAll("rect")
      .transition(t)
      .attr("x", (d) => x(Math.min((d as ProcessedSourceItemData).profitFromBuyOrder, 0)))
      .attr("width", (d) =>
        Math.abs(x((d as ProcessedSourceItemData).profitFromBuyOrder) - x(0))
      );
  }, [sortedData, x, y]);

  return (
    <svg width={width} height={height}>
      <g ref={gRect}></g>
      <g style={{ fill: "white" }}>
        <g ref={gName}></g>
        <g ref={gValue}></g>
      </g>
      <g ref={gAxis}></g>
      <g ref={gImg}></g>
    </svg>
  );
}
