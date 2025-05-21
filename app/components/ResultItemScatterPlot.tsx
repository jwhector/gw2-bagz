import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { ProcessedSourceItemData } from "../api/lib/types";

const BAR_HEIGHT = 20;
const IMAGE_SIZE = 20;
const MARGIN_TOP = 30;
const MARGIN_RIGHT = 60;
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 60;
const SVG_WIDTH = 700;
const SVG_HEIGHT = 600;

export default function ResultItemScatterPlot({
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

  const gLine = useRef(null);
  const gDot = useRef(null);
  const gName = useRef(null);
  const gValue = useRef(null);
  const gAxis = useRef(null);
  const gImg = useRef(null);
  const gContainer = useRef(null);

  const resultItemsArray = Object.values(sourceItemData.contents);
  const sortedResultItemsData = d3.sort(
    resultItemsArray,
    (a, b) => b.valueContributionPercentage - a.valueContributionPercentage
  );
  const height = SVG_HEIGHT;
  const width = SVG_WIDTH;

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(sortedResultItemsData, (d) => d.dropRate) || 0])
        .rangeRound([MARGIN_LEFT, width - MARGIN_RIGHT]),
    [sortedResultItemsData, width]
  );

  const y = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([
          0,
          d3.max(sortedResultItemsData, (d) =>
            d.valueContributionPercentage
          ) || 0,
        ])
        .rangeRound([MARGIN_TOP, height - MARGIN_BOTTOM]),
    [sortedResultItemsData, height]
  );

  useEffect(() => {
    // Item images
    d3.select(gImg.current)
      .selectAll("image")
      .data(sortedResultItemsData)
      .join("image")
      .attr("x", (d) => x(d.dropRate))
      .attr("y", (d) => SVG_HEIGHT - y(d.valueContributionPercentage))
      .attr("width", IMAGE_SIZE)
      .attr("height", IMAGE_SIZE)
      .attr("href", (d) => d.icon);
  }, [x, y, sortedResultItemsData, sourceItemData]);

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <g ref={gContainer}>
          <g ref={gLine}></g>
          <g ref={gDot}></g>
          <g ref={gAxis}></g>
        </g>
        <g ref={gImg}></g>
      </svg>
    </div>
  );
}
