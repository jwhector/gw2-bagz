import { useEffect, useRef, useState } from "react";
import {
  ProcessedItemData,
  ProcessedResultItemData,
  ProcessedSourceItemData,
  // ProcessedSourceItemData, // This import seems unused in the original snippet
  SourceItemContents,
} from "../api/lib/types"; // Assuming your type definitions are here
import * as d3 from "d3";
import { FastAverageColor, FastAverageColorResult } from "fast-average-color"; // Import FastAverageColor

// Helper type for slice colors state
type SliceColors = Record<string, string>; // Key: icon URL or unique item ID, Value: hex color string

const SVG_SIZE = 500;
const RADIUS = SVG_SIZE / 2;
const INNER_RADIUS = RADIUS * 0.5;
const OUTER_RADIUS = RADIUS * 0.8;

export default function SourceItemSunburstChart({
  data,
  sourceItemId,
}: {
  data: ProcessedItemData;
  sourceItemId: number;
}) {
  const { sourceItems /*, resultItems*/ } = data; // resultItems seems unused
  // Ensure sourceItems[sourceItemId] exists before trying to access it
  const initialSourceItem =
    sourceItems && sourceItems[sourceItemId] ? sourceItems[sourceItemId] : null;
  const [sourceItem, setSourceItem] = useState(initialSourceItem);
  const [focusedItem, setFocusedItem] = useState<
    ProcessedSourceItemData | SourceItemContents | null
  >(initialSourceItem);

  // State to store the fetched average colors for each slice
  const [sliceColors, setSliceColors] = useState<SliceColors>({});

  const gArc = useRef<SVGGElement>(null);
  const gImage = useRef<SVGGElement>(null);
  const gText = useRef<SVGGElement>(null);
  const gInner = useRef<SVGGElement>(null);

  // Update sourceItem if data or sourceItemId changes
  useEffect(() => {
    const newSourceItem =
      sourceItems && sourceItems[sourceItemId]
        ? sourceItems[sourceItemId]
        : null;
    setSourceItem(newSourceItem);
    setFocusedItem(newSourceItem);
  }, [sourceItems, sourceItemId]);

  // Effect to fetch average colors when sourceItem changes
  useEffect(() => {
    if (
      !sourceItem ||
      !sourceItem.contents ||
      sourceItem.contents.length === 0
    ) {
      setSliceColors({}); // Reset colors if no content
      return;
    }

    const fac = new FastAverageColor();
    const newColors: SliceColors = {};
    const colorPromises: Promise<void>[] = [];

    sourceItem.contents.forEach((contentItem) => {
      // Use a unique key for the color map, icon URL is good if available and unique
      const colorKey = contentItem.icon || contentItem.name; // Fallback to name if no icon

      if (contentItem.icon) {
        const promise = fac
          .getColorAsync(contentItem.icon)
          .then((color: FastAverageColorResult) => {
            if (color.hex) {
              newColors[colorKey] = color.hex;
            } else {
              console.warn(
                `FastAverageColor did not return a hex for ${contentItem.icon}`
              );
              newColors[colorKey] = "#CCCCCC"; // Fallback color
            }
          })
          .catch((e) => {
            console.error(
              `Error getting average color for ${contentItem.icon}:`,
              e
            );
            newColors[colorKey] = "#CCCCCC"; // Fallback color on error
          });
        colorPromises.push(promise);
      } else {
        newColors[colorKey] = "#E0E0E0"; // Different fallback if no icon URL
      }
    });

    Promise.all(colorPromises)
      .then(() => {
        setSliceColors((prevColors) => ({ ...prevColors, ...newColors }));
      })
      .catch((error) => {
        console.error("Error processing color promises:", error);
      });

    // Cleanup function for FastAverageColor instance if needed, though usually not for basic usage
    // return () => { fac.destroy(); };
  }, [sourceItem]); // Re-run when sourceItem changes

  // Effect to draw/update the D3 chart on sourceItem change
  useEffect(() => {
    // Ensure refs are current and we have the necessary data
    if (
      !gArc.current ||
      !gImage.current ||
      !gText.current ||
      !sourceItem ||
      !sourceItem.contents ||
      sourceItem.contents.length === 0
    ) {
      // Clear previous drawings if data is not available
      d3.select(gArc.current).selectAll("*").remove();
      d3.select(gImage.current).selectAll("*").remove();
      d3.select(gText.current).selectAll("*").remove();
      return;
    }

    const width = SVG_SIZE;
    const height = SVG_SIZE;

    const pie = d3
      .pie<SourceItemContents>()
      .value((d) => d.valueContribution)
      .sort((a, b) => b.valueContribution - a.valueContribution); // Maintain original order or specify sort

    // The data for slices needs to be cast correctly if SourceItemContents is not directly usable by d3.pie
    const slices = pie(sourceItem.contents as Array<SourceItemContents>);

    // Arcs (pie slices)
    d3.select(gArc.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`) // Center the group
      .selectAll("path")
      .data(slices)
      .join("path")
      .attr(
        "d",
        d3
          .arc<d3.PieArcDatum<SourceItemContents>>()
          .innerRadius(INNER_RADIUS)
          .outerRadius(OUTER_RADIUS)
      )
      .attr("fill", (d) => {
        const colorKey = d.data.icon || d.data.name;
        return sliceColors[colorKey] || "#DDDDDD";
      })
      .attr("stroke", "white")
      .style("stroke-width", "1px")
      .on("mouseover", (event, d) => {
        setFocusedItem(d.data);
        d3.select(event.currentTarget)
          .transition()
          .duration(100)
          .style("opacity", 0.7);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(100)
          .style("opacity", 1);
        setFocusedItem(sourceItem);
      });

    // Item Icons
    const iconSize = 30;
    d3.select(gImage.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .selectAll("image")
      .data(slices)
      .join("image")
      .attr("xlink:href", (d) => d.data.icon) // Ensure icons are accessible via URL
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("transform", (d) => {
        const [x, y] = d3
          .arc<d3.PieArcDatum<SourceItemContents>>()
          .innerRadius(INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * 0.5) // Position in the middle of the arc
          .outerRadius(INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * 0.5)
          .centroid(d);
        return `translate(${x - iconSize / 2}, ${y - iconSize / 2})`;
      })
      .style("pointer-events", "none")
      .style("display", (d) =>
        Math.abs(d.startAngle - d.endAngle) / (2 * Math.PI) > 0.05
          ? "block"
          : "none"
      );

    // Item Names (Labels)
    d3.select(gText.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .selectAll("text")
      .data(slices)
      .join("text")
      .text((d) => d.data.name)
      .attr("transform", (d) => {
        const [x, y] = d3
          .arc<d3.PieArcDatum<SourceItemContents>>()
          .innerRadius(OUTER_RADIUS + 5) // Position outside the arc
          .outerRadius(OUTER_RADIUS + 5)
          .centroid(d);
        // Basic collision avoidance: if text is on left, anchor end, else anchor start
        return `translate(${x}, ${y})`;
      })
      .style("text-anchor", (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? "start" : "end";
      })
      .style("font-size", "10px")
      .style("fill", "black"); // Or a theme-appropriate color
  }, [sourceItem, sliceColors]);

  return (
    <svg width={SVG_SIZE} height={SVG_SIZE}>
      <g>
        <g ref={gArc}></g>
        <g ref={gImage}></g>
        <g ref={gText}></g>
      </g>
      <g ref={gInner} x={250} y={250}>
        {/* Gray tint circle - shows when focusedItem is a slice (not a source item) and focusedItem exists */}
        {focusedItem && !focusedItem.isSourceItem && (
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={INNER_RADIUS}
            fill={
              sliceColors[focusedItem.icon || focusedItem.name] || "#DDDDDD"
            }
            fillOpacity={0.2} // A light gray tint
          />
        )}

        {/* Icon, shown if focusedItem exists */}
        {focusedItem && (
          <image
            xlinkHref={focusedItem.icon}
            width={50}
            height={50}
            x={225}
            y={160}
          />
        )}

        {/* Display name if focusedItem exists */}
        {focusedItem && (
          <text
            x={250}
            y={230}
            textAnchor="middle"
            fontSize="16px"
            fill="white"
          >
            {focusedItem.name}
          </text>
        )}

        {focusedItem && (
          <text
            x={SVG_SIZE / 2}
            y={SVG_SIZE / 2 + 10}
            textAnchor="middle"
            fontSize="14px"
            fill="white"
          >
            <tspan x={SVG_SIZE / 2} dy={0}>
              Sell price: {focusedItem.sells.unit_price}
            </tspan>
            <tspan x={SVG_SIZE / 2} dy={14}>
              Buy price: {focusedItem.buys.unit_price}
            </tspan>
          </text>
        )}

        {/* Display valueContribution if focusedItem is a slice (SourceItemContents) */}
        {focusedItem && !focusedItem.isSourceItem && (
          <>
            <text
              x={SVG_SIZE / 2}
              y={SVG_SIZE / 2 + 45}
              textAnchor="middle"
              fontSize="14px"
              fill="white"
            >
              Value Contribution: {d3.format(".2f")((focusedItem as SourceItemContents).valueContribution)}
            </text>
            <text x={SVG_SIZE / 2} y={SVG_SIZE / 2 + 60} textAnchor="middle" fontSize="14px" fill="white">
              Drop Rate: {d3.format(".1%")(focusedItem.dropRate)}
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
