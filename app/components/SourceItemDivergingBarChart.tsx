import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type {
  ProcessedItemData,
  ProcessedSourceItemData,
} from "../api/lib/types";

export default function SourceItemDivergingBarChart({
  data,
  onSourceItemClick,
}: {
  data: ProcessedItemData;
  onSourceItemClick: (sourceItemId: number) => void;
}) {
  const { sourceItems } = data;
  const [showPieChart, setShowPieChart] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<ProcessedSourceItemData | null>(null);

  const gRect = useRef(null);
  const gName = useRef(null);
  const gValue = useRef(null);
  const gAxis = useRef(null);
  const gImg = useRef(null);
  const gContainer = useRef(null);

  const sourceItemsArray = Object.values(sourceItems);
  const sortedData = d3.sort(
    sourceItemsArray,
    (a, b) => b.profitFromBuyOrder - a.profitFromBuyOrder
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

  const handleMouseIn = (data: ProcessedSourceItemData) => {
    d3.select(gRect.current)
      .selectAll("rect")
      .filter((d) => (d as ProcessedSourceItemData).name === data.name)
      .style("opacity", 0.7);

    d3.select(gName.current)
      .selectAll("text")
      .filter((d) => (d as ProcessedSourceItemData).name === data.name)
      .style("opacity", 0.7);
  };

  const handleMouseOut = (data: ProcessedSourceItemData) => {
    d3.select(gRect.current)
      .selectAll("rect")
      .filter((d) => (d as ProcessedSourceItemData).name === data.name)
      .style("opacity", 1);

    d3.select(gName.current)
      .selectAll("text")
      .filter((d) => (d as ProcessedSourceItemData).name === data.name)
      .style("opacity", 1);
  };

  useEffect(() => {
    // if (!gRect.current || !gImg.current) return;

    const handleSourceItemClick = (data: ProcessedSourceItemData) => {
      setSelectedItem(data);
      setShowPieChart((prev) => !prev);
      console.log("showPieChart", showPieChart);
      onSourceItemClick(data.id);
    };

    console.log("Drawing diverging bar chart");

    if (!showPieChart) {
      d3.select(gContainer.current)
        .style("display", "block")
        .transition()
        .duration(750)
        .style("opacity", 1);
      d3.select(gImg.current)
        .selectAll("image")
        .style("display", "block")
        .transition()
        .duration(750)
        .style("opacity", 1);

      d3.select(gRect.current)
        .selectAll("rect")
        .data(sortedData)
        .join("rect")
        .attr("fill", (d) => (d.profitFromBuyOrder > 0 ? "green" : "red"))
        .attr("x", () => x(0))
        .attr("y", (d) => y(d.name)!)
        .attr("width", 0)
        .attr("height", y.bandwidth())
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => handleMouseIn(d))
        .on("mouseout", (event, d) => handleMouseOut(d))
        .on("click", (event, d) =>
          handleSourceItemClick(d as ProcessedSourceItemData)
        );

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
        .attr("clip-path", (d) => `url(#circleClip-${d.id})`)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => handleMouseIn(d))
        .on("mouseout", (event, d) => handleMouseOut(d))
        .on("click", (event, d) =>
          handleSourceItemClick(d as ProcessedSourceItemData)
        );

      d3.select(gName.current)
        .selectAll("text")
        .data(sortedData)
        .join("text")
        .text((d) => d.name)
        .attr("text-anchor", (d) =>
          d.profitFromBuyOrder > 0 ? "end" : "start"
        )
        .attr("x", (d) => x(0) + (d.profitFromBuyOrder > 0 ? -15 : 15))
        .attr("y", (d) => y(d.name)! + y.bandwidth() / 2 + y.padding() / 2)
        .attr("dy", "0.35em")
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => handleMouseIn(d))
        .on("mouseout", (event, d) => handleMouseOut(d))
        .on("click", (event, d) =>
          handleSourceItemClick(d as ProcessedSourceItemData)
        );

      d3.select(gValue.current)
        .selectAll("text")
        .data(sortedData)
        .join("text")
        .text((d) => d3.format("+.1f")(d.profitFromBuyOrder))
        .attr("text-anchor", (d) =>
          d.profitFromBuyOrder > 0 ? "start" : "end"
        )
        .attr(
          "x",
          (d) => x(d.profitFromBuyOrder) + (d.profitFromBuyOrder > 0 ? 10 : -10)
        )
        .attr("y", (d) => y(d.name)! + y.bandwidth() / 2)
        .attr("dy", "0.35em");
    }
  }, [sortedData, x, y, showPieChart, onSourceItemClick]);

  useEffect(() => {
    if (!gRect.current) return;

    if (showPieChart) {
      d3.select(gRect.current)
        .selectAll("rect")
        .transition()
        .duration(750)
        .attr("x", () => x(0))
        .attr("width", 0);
      d3.select(gContainer.current)
        .transition()
        .duration(750)
        .style("opacity", 0)
        .end()
        .then(() => {
          d3.select(gContainer.current).style("display", "none");
        });
      d3.select(gImg.current)
        .selectAll("image")
        .filter((d) => (d as ProcessedSourceItemData).id !== selectedItem?.id)
        .transition()
        .duration(750)
        .style("opacity", 0)
        .end()
        .then(() => {
          d3.select(gImg.current)
            .selectAll("image")
            .filter(
              (d) => (d as ProcessedSourceItemData).id !== selectedItem?.id
            )
            .style("display", "none");
        });
    } else {
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
    }
  }, [sortedData, x, y, showPieChart, selectedItem?.id]);

  // if (showPieChart && selectedItem) {
  //   return (
  //     <div>
  //       <button
  //         onClick={() => {
  //           setShowPieChart(false);
  //           setSelectedItem(null);
  //         }}
  //       >
  //         Back to Bar Chart
  //       </button>
  //       <h2>Pie Chart for {selectedItem.name}</h2>
  //       {/* Placeholder for the actual Pie Chart component */}
  //       <p>Details: {JSON.stringify(selectedItem)}</p>
  //     </div>
  //   );
  // }

  return (
    <svg width={width} height={height}>
      <g ref={gContainer}>
        <g ref={gRect}></g>
        <g style={{ fill: "white" }}>
          <g ref={gName}></g>
          <g ref={gValue}></g>
        </g>
        <g ref={gAxis}></g>
      </g>
      <g ref={gImg}></g>
    </svg>
  );
}
