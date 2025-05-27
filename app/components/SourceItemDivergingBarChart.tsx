import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import * as d3 from "d3";
import type {
  ProcessedItemData,
  ProcessedSourceItemData,
} from "../api/lib/types";
import SourceItemDonutChart from "./SourceItemDonutChart";

const SVG_WIDTH = 700;

export default function SourceItemDivergingBarChart({
  data,
  onSourceItemClick,
}: {
  data: ProcessedItemData;
  onSourceItemClick: (sourceItemId: number) => void;
}) {
  const { sourceItems } = data;
  const [hoveredItem, setHoveredItem] =
    useState<ProcessedSourceItemData | null>(null);
  const [donutPosition, setDonutPosition] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [isOverDonut, setIsOverDonut] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const gRect = useRef(null);
  const gName = useRef(null);
  const gValue = useRef(null);
  const gAxis = useRef(null);
  const gImg = useRef(null);
  const gContainer = useRef(null);
  const gDefs = useRef(null);
  const gOverlay = useRef(null);

  const sourceItemsArray = useMemo(
    () => Object.values(sourceItems),
    [sourceItems]
  );
  const sortedData = useMemo(
    () =>
      d3.sort(
        sourceItemsArray,
        (a, b) => b.profitFromBuyOrder - a.profitFromBuyOrder
      ),
    [sourceItemsArray]
  );
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
        .domain(
          d3.extent(sortedData, (d) => d.profitFromBuyOrder) as [number, number]
        )
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

  const handleMouseIn = useCallback(
    (event: React.MouseEvent, data: ProcessedSourceItemData) => {
      d3.select(gRect.current)
        .selectAll("rect")
        .filter((d) => (d as ProcessedSourceItemData).name === data.name)
        .style("opacity", 0.7);

      d3.select(gName.current)
        .selectAll("text")
        .filter((d) => (d as ProcessedSourceItemData).name === data.name)
        .style("opacity", 0.7)
        .on("click", () => onSourceItemClick(data.id));

      d3.select(gValue.current)
        .selectAll("text")
        .filter((d) => (d as ProcessedSourceItemData).name === data.name)
        .style("opacity", 0.7);

      // Set the hovered item and position for the donut chart
      setHoveredItem(data);

      // Position the donut chart relative to the bar
      // Try to position donut to the right of the bar
      let xPos = x(Math.max(data.profitFromBuyOrder, 0)) + 50;

      // If it would go off-screen to the right, position it to the left of the bar
      if (xPos + 300 > width) {
        // 300 is the width of our donut chart
        xPos = x(Math.min(data.profitFromBuyOrder, 0)) - 300 - 50;
      }

      setDonutPosition({
        x: xPos,
        y: y(data.name)! - 300 / 2 + barHeight / 2, // 300 is the height of our donut chart
      });
    },
    [x, y, width, onSourceItemClick]
  );

  const handleMouseOut = useCallback(() => {
    // Only hide everything if we're not over the donut chart
    d3.select(gRect.current).selectAll("rect").style("opacity", 1);

    d3.select(gName.current).selectAll("text").style("opacity", 1);

    d3.select(gValue.current).selectAll("text").style("opacity", 1);
    if (!isOverDonut) {
      // Clear the hovered item
      setHoveredItem(null);
      setDonutPosition(undefined);
    }
  }, [isOverDonut]);

  const handleDonutMouseEnter = useCallback(() => {
    setIsOverDonut(true);
  }, []);

  const handleDonutMouseLeave = useCallback(() => {
    setIsOverDonut(false);
    d3.select(gRect.current).selectAll("rect").style("opacity", 1);

    d3.select(gName.current).selectAll("text").style("opacity", 1);

    d3.select(gValue.current).selectAll("text").style("opacity", 1);

    setHoveredItem(null);
    setDonutPosition(undefined);
  }, []);

  // Initial chart setup - only run once when data changes
  useEffect(() => {
    console.log("Drawing diverging bar chart");
    // Create pattern definitions for diagonal stripes
    d3.select(gDefs.current)
      .html("")
      .append("pattern")
      .attr("id", "diagonalHatchGreen")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .append("path")
      .attr("d", "M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4")
      .attr("stroke", "#4ade80")
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none");

    d3.select(gDefs.current)
      .append("pattern")
      .attr("id", "diagonalHatchRed")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .append("path")
      .attr("d", "M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4")
      .attr("stroke", "#f87171")
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none");

    d3.select(gContainer.current).style("display", "block").style("opacity", 1);
    d3.select(gImg.current)
      .selectAll("image")
      .style("display", "block")
      .style("opacity", 1);

    d3.select(gRect.current)
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
      .attr("fill", (d) => (d.profitFromBuyOrder > 0 ? "#22c55e" : "#ef4444"))
      .attr("fill-opacity", 0.3)
      .attr("stroke", (d) => (d.profitFromBuyOrder > 0 ? "#22c55e" : "#ef4444"))
      .attr("stroke-width", 1)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("x", () => x(0))
      .attr("y", (d) => y(d.name)!)
      .attr("width", () => 0)
      .attr("height", y.bandwidth());

    d3.select(gRect.current)
      .selectAll(".pattern-overlay")
      .data(sortedData)
      .join("rect")
      .attr("class", "pattern-overlay")
      .attr("fill", (d) =>
        d.profitFromBuyOrder > 0
          ? "url(#diagonalHatchGreen)"
          : "url(#diagonalHatchRed)"
      )
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("x", () => x(0))
      .attr("y", (d) => y(d.name)!)
      .attr("width", () => Math.abs(0))
      .attr("height", y.bandwidth())
      .style("pointer-events", "none");

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
      .attr(
        "x",
        (d) => x(0) + (d.profitFromBuyOrder > 0 ? 10 : -10)
      )
      .attr("y", (d) => y(d.name)! + y.bandwidth() / 2)
      .attr("dy", "0.35em");

    setIsInitialized(true);
  }, [sortedData, x, y]); // Remove onSourceItemClick to prevent unnecessary rerenders

  // Setup mouse event listeners
  useEffect(() => {
    if (!isInitialized) return;

    d3.select(gOverlay.current)
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
      .attr("width", () => SVG_WIDTH)
      .attr("height", () => barHeight)
      .attr("y", (d) => y(d.name)!)
      .attr("fill", "none")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all")
      .on("mouseover", (event, d) => handleMouseIn(event, d))
      .on("mouseout", handleMouseOut)
      .on("click", (event, d) => onSourceItemClick(d.id));
  }, [sortedData, y, handleMouseIn, handleMouseOut, isInitialized, onSourceItemClick]);

  // Animate the bars
  useEffect(() => {
    if (!isInitialized) return;

    d3.select(gRect.current)
      .selectAll("rect")
      .transition()
      .duration(750)
      .attr("x", (d) =>
        x(Math.min((d as ProcessedSourceItemData).profitFromBuyOrder, 0))
      )
      .attr("width", (d) =>
        Math.abs(x((d as ProcessedSourceItemData).profitFromBuyOrder) - x(0))
      );

    d3.select(gRect.current)
      .selectAll(".pattern-overlay")
      .transition()
      .duration(750)
      .attr("x", (d) =>
        x(Math.min((d as ProcessedSourceItemData).profitFromBuyOrder, 0))
      )
      .attr("width", (d) =>
        Math.abs(x((d as ProcessedSourceItemData).profitFromBuyOrder) - x(0))
      );

    d3.select(gValue.current)
      .selectAll("text")
      .transition()
      .duration(750)
      .attr(
        "x",
        (d) =>
          x((d as ProcessedSourceItemData).profitFromBuyOrder) +
          ((d as ProcessedSourceItemData).profitFromBuyOrder > 0 ? 10 : -10)
      );
  }, [sortedData, x, isInitialized]);

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <defs ref={gDefs}></defs>
        <g ref={gContainer}>
          <g ref={gRect}></g>
          <g style={{ fill: "white" }}>
            <g ref={gName}></g>
            <g ref={gValue}></g>
          </g>
          <g ref={gImg}></g>
          <g ref={gAxis}></g>
          <g ref={gOverlay}></g>
        </g>
      </svg>

      <SourceItemDonutChart
        sourceItem={hoveredItem}
        position={donutPosition}
        isVisible={!!hoveredItem && !!donutPosition}
        onMouseEnter={handleDonutMouseEnter}
        onMouseLeave={handleDonutMouseLeave}
      />
    </div>
  );
}
