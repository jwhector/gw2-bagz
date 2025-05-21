import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { ProcessedSourceItemData } from "../api/lib/types";

// We'll use a more specific interface for our chart data
interface ChartDataPoint {
  value: number;
  key: "valueContributionPercentage" | "dropRate";
  parent: Record<string, unknown>; // More type-safe than 'any'
}

const BAR_HEIGHT = 20;
const MARGIN_TOP = 30;
const MARGIN_RIGHT = 100;
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 60;
const SVG_WIDTH = 700;

export default function ResultItemBarChart({
  sourceItemData,
}: {
  sourceItemData: ProcessedSourceItemData;
}) {
  const [hoveredItem, setHoveredItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [donutPosition, setDonutPosition] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [isOverDonut, setIsOverDonut] = useState(false);

  const gLine = useRef<SVGGElement>(null);
  const gDot = useRef<SVGGElement>(null);
  const gName = useRef<SVGGElement>(null);
  const gValue = useRef<SVGGElement>(null);
  const gAxis = useRef<SVGGElement>(null);
  const gImg = useRef<SVGGElement>(null);
  const gContainer = useRef<SVGGElement>(null);
  const gDotLabels = useRef<SVGGElement>(null);

  const resultItemsArray = Object.values(sourceItemData.contents);
  const sortedResultItemsData = d3.sort(
    resultItemsArray,
    (a, b) => b.valueContributionPercentage - a.valueContributionPercentage
  );
  const height =
    Math.ceil((sortedResultItemsData.length + 0.3) * BAR_HEIGHT * 2) +
    MARGIN_TOP +
    MARGIN_BOTTOM;
  const width = SVG_WIDTH;

  const fy = useMemo(() => {
    return d3
      .scaleBand()
      .domain(sortedResultItemsData.map((d) => d.name))
      .rangeRound([MARGIN_TOP, height - MARGIN_BOTTOM])
      .paddingInner(0.2);
  }, [sortedResultItemsData, height]);

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([
          0,
          d3.max(sortedResultItemsData, (d) =>
            Math.max(d.valueContributionPercentage, d.dropRate)
          ) || 0,
        ])
        .rangeRound([MARGIN_LEFT, width - MARGIN_RIGHT]),
    [sortedResultItemsData, width]
  );

  const y = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(["valueContributionPercentage", "dropRate"])
        .rangeRound([0, fy.bandwidth()])
        .paddingInner(0.3),
    [fy]
  );

  const handleMouseIn = (event: Event, data: Record<string, unknown>) => {
    d3.select(gLine.current)
      .selectAll("line")
      .filter((d) => (d as ChartDataPoint).parent.name === data.name)
      .style("opacity", 0.7);

    d3.select(gDot.current)
      .selectAll("circle")
      .filter((d) => (d as ChartDataPoint).parent.name === data.name)
      .style("opacity", 0.7);

    d3.select(gName.current)
      .selectAll("text")
      .filter((d) => {
        const item = d as Record<string, unknown>;
        return item.name === data.name;
      })
      .style("opacity", 0.7);

    d3.select(gValue.current)
      .selectAll("text")
      .filter((d) => {
        const item = d as Record<string, unknown>;
        return item.name === data.name;
      })
      .style("opacity", 0.7);

    // Set the hovered item
    setHoveredItem(data);

    // Position the donut chart
    const profitValue =
      typeof data.profitFromBuyOrder === "number" ? data.profitFromBuyOrder : 0;
    let xPos = x(Math.max(profitValue, 0)) + 55;
    if (xPos + 300 > width) {
      xPos = x(Math.min(profitValue, 0)) - 300 - 55;
    }

    // Only set position if we have a valid name
    if (typeof data.name === "string") {
      setDonutPosition({
        x: xPos,
        y: y(data.name as string)! - 300 / 2 + BAR_HEIGHT / 2,
      });
    }
  };

  const handleMouseOut = () => {
    if (!isOverDonut) {
      d3.select(gLine.current).selectAll("line").style("opacity", 1);
      d3.select(gDot.current).selectAll("circle").style("opacity", 1);
      d3.select(gName.current).selectAll("text").style("opacity", 1);
      d3.select(gValue.current).selectAll("text").style("opacity", 1);

      setHoveredItem(null);
      setDonutPosition(undefined);
    }
  };

  useEffect(() => {
    // Draw lines
    d3.select(gLine.current).selectAll("*").remove();
    d3.select(gLine.current)
      .selectAll("g")
      .data(sortedResultItemsData)
      .join("g")
      .attr("transform", (d) => `translate(0, ${fy(d.name)})`)
      .selectAll("line")
      .data((d) => {
        return [
          {
            value: d.valueContributionPercentage,
            key: "valueContributionPercentage" as const,
          },
          {
            value: d.dropRate,
            key: "dropRate" as const,
          },
        ];
      })
      .join("line")
      .attr("x1", x(0) + BAR_HEIGHT * 2)
      .attr("y1", (d) => y(d.key)! + BAR_HEIGHT / 2)
      .attr("x2", (d) => x(d.value) + BAR_HEIGHT * 2)
      .attr("y2", (d) => y(d.key)! + BAR_HEIGHT / 2)
      .attr("stroke", (d) =>
        d.key === "valueContributionPercentage" ? "yellow" : "blue"
      )
      .attr("stroke-width", 2);

    // Draw dots
    d3.select(gDot.current).selectAll("*").remove();
    d3.select(gDot.current)
      .selectAll("g")
      .data(sortedResultItemsData)
      .join("g")
      .attr("transform", (d) => `translate(0, ${fy(d.name)})`)
      .selectAll("circle")
      .data((d) => {
        return [
          {
            value: d.valueContributionPercentage,
            key: "valueContributionPercentage" as const,
          },
          {
            value: d.dropRate,
            key: "dropRate" as const,
          },
        ];
      })
      .join("circle")
      .attr("cx", (d) => x(d.value) + BAR_HEIGHT * 2)
      .attr("cy", (d) => y(d.key)! + BAR_HEIGHT / 2)
      .attr("r", 6)
      .attr("fill", (d) =>
        d.key === "valueContributionPercentage" ? "yellow" : "blue"
      );

    // Item images
    d3.select(gImg.current)
      .selectAll("image")
      .data(sortedResultItemsData)
      .join("image")
      .attr("x", x(0))
      .attr("y", (d) => fy(d.name)!)
      .attr("width", BAR_HEIGHT * 2 - 5)
      .attr("height", BAR_HEIGHT * 2 - 5)
      .attr("href", (d) => d.icon);

    // Add x-axis at the top
    d3.select(gAxis.current).selectAll("*").remove();
    const xAxis = d3.axisTop(x).ticks(5, ".0%");
    d3.select(gAxis.current)
      .attr("transform", `translate(${BAR_HEIGHT * 2}, ${MARGIN_TOP})`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(xAxis as unknown as any)
      .call((g) => g.select(".domain").attr("stroke", "white"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "white"))
      .call((g) => g.selectAll(".tick text").attr("fill", "white"));

    // Add labels for each dot
    d3.select(gDotLabels.current).selectAll("*").remove();
    d3.select(gDotLabels.current)
      .selectAll("g")
      .data(sortedResultItemsData)
      .join("g")
      .attr("transform", (d) => `translate(0, ${fy(d.name)})`)
      .selectAll("text")
      .data((d) => {
        return [
          {
            value: d.valueContributionPercentage,
            key: "valueContributionPercentage" as const,
            parent: d,
          },
          {
            value: d.dropRate,
            key: "dropRate" as const,
            parent: d,
          },
        ];
      })
      .join("text")
      .attr("x", (d) => x(d.value) + BAR_HEIGHT * 2 + 10)
      .attr("y", (d) => y(d.key)! + BAR_HEIGHT / 2 + 4)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text((d) => d3.format(".1%")(d.value));
  }, [fy, x, y, sortedResultItemsData, sourceItemData]);

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <g ref={gContainer}>
          <g ref={gLine}></g>
          <g ref={gDot}></g>
          <g ref={gDotLabels}></g>
          <g style={{ fill: "white" }}>
            <g ref={gName}></g>
            <g ref={gValue}></g>
          </g>
          <g ref={gAxis}></g>
        </g>
        <g ref={gImg}></g>
      </svg>
    </div>
  );
}
