import { useEffect, useRef, useState } from "react";
import { ProcessedSourceItemData, SourceItemContents } from "../api/lib/types";
import * as d3 from "d3";
import { FastAverageColor, FastAverageColorResult } from "fast-average-color"; // Import FastAverageColor

// Helper type for slice colors state
type SliceColors = Record<string, string>; // Key: icon URL or unique item ID, Value: hex color string

const SVG_SIZE = 300;
const RADIUS = SVG_SIZE / 2;
const INNER_RADIUS = RADIUS * 0.5;
const OUTER_RADIUS = RADIUS * 0.8;

export default function SourceItemDonutChart({
  sourceItem,
  position,
  isVisible = true,
  onMouseEnter,
  onMouseLeave,
}: {
  sourceItem: ProcessedSourceItemData | null;
  position?: { x: number; y: number };
  isVisible?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [focusedItem, setFocusedItem] = useState<
    ProcessedSourceItemData | SourceItemContents | null
  >(sourceItem);

  // State to store the fetched average colors for each slice
  const [sliceColors, setSliceColors] = useState<SliceColors>({});

  const gArc = useRef<SVGGElement>(null);
  const gImage = useRef<SVGGElement>(null);
  const gText = useRef<SVGGElement>(null);
  const gInner = useRef<SVGGElement>(null);

  // Update focusedItem if sourceItem changes
  useEffect(() => {
    setFocusedItem(sourceItem);
  }, [sourceItem]);

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
  }, [sourceItem]);

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

    // Clear previous content
    d3.select(gArc.current).selectAll("*").remove();
    d3.select(gImage.current).selectAll("*").remove();
    d3.select(gText.current).selectAll("*").remove();
    d3.select(gInner.current).selectAll("*").remove();

    const pie = d3
      .pie<SourceItemContents>()
      .value((d) => d.valueContribution)
      .sort((a, b) => b.valueContribution - a.valueContribution);

    // Create the arc generator
    const arcGenerator = d3
      .arc<d3.PieArcDatum<SourceItemContents>>()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS);

    // The data for slices
    const slices = pie(sourceItem.contents as Array<SourceItemContents>);

    // Arcs (pie slices)
    d3.select(gArc.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`) // Center the group
      .selectAll("path")
      .data(slices)
      .join("path")
      .attr("d", arcGenerator)
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
    const iconSize = 23;

    // Create arc generator for icon positioning
    const iconArcGenerator = d3
      .arc<d3.PieArcDatum<SourceItemContents>>()
      .innerRadius(INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * 0.5)
      .outerRadius(INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * 0.5);

    d3.select(gImage.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .selectAll("image")
      .data(slices)
      .join("image")
      .attr("xlink:href", (d) => d.data.icon) // Ensure icons are accessible via URL
      .attr("width", (d) => {
        if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.05) {
          return iconSize;
        } else if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.02) {
          return iconSize * 0.5;
        } else {
          return 0;
        }
      })
      .attr("height", (d) => {
        if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.05) {
          return iconSize;
        } else if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.02) {
          return iconSize * 0.5;
        } else {
          return 0;
        }
      })
      .attr("transform", (d) => {
        const [x, y] = iconArcGenerator.centroid(d);
        if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.05) {
          return `translate(${x - iconSize / 2}, ${y - iconSize / 2})`;
        } else if (Math.abs(d.endAngle - d.startAngle) / (2 * Math.PI) > 0.02) {
          return `translate(${x - (iconSize * 0.5) / 2}, ${
            y - (iconSize * 0.5) / 2
          })`;
        } else {
          return null;
        }
      })
      .style("pointer-events", "none");

    // Center content
    d3.select(gInner.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .append("circle")
      .attr("r", INNER_RADIUS)
      .attr("fill", "rgba(0, 0, 0, 0.7)");

    // Add the source item icon to the center
    d3.select(gInner.current)
      .append("image")
      .attr("xlink:href", focusedItem?.icon || "")
      .attr("width", 50)
      .attr("height", 50)
      .attr("x", -25)
      .attr("y", -65);

    // Item name
    d3.select(gInner.current)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -5)
      .attr("font-size", "16px")
      .attr("fill", "white")
      .text(focusedItem?.name || "");

    // Price information
    if (focusedItem) {
      d3.select(gInner.current)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 25)
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(`Sell: ${focusedItem.sells?.unit_price || 0}`);

      d3.select(gInner.current)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 45)
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(`Buy: ${focusedItem.buys?.unit_price || 0}`);
    }

    // Additional info for content items
    if (focusedItem && "valueContribution" in focusedItem) {
      d3.select(gInner.current)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 65)
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(`Value: ${d3.format(".2f")(focusedItem.valueContribution)}`);

      if ("dropRate" in focusedItem) {
        d3.select(gInner.current)
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", 85)
          .attr("font-size", "14px")
          .attr("fill", "white")
          .text(`Drop: ${d3.format(".1%")(focusedItem.dropRate)}`);
      }
    }
  }, [sourceItem, sliceColors, focusedItem]);

  if (!isVisible || !sourceItem) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: position?.y || 0,
        left: position?.x || 0,
        background: "rgba(0, 0, 0, 0.8)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
        zIndex: 100,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg width={SVG_SIZE} height={SVG_SIZE}>
        <g ref={gArc}></g>
        <g ref={gImage}></g>
        <g ref={gText}></g>
        <g ref={gInner}></g>
      </svg>
    </div>
  );
}
