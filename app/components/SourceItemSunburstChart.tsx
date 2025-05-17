import { useEffect, useRef, useState } from "react";
import {
  ProcessedItemData,
  // ProcessedSourceItemData, // This import seems unused in the original snippet
  SourceItemContents,
} from "../api/lib/types"; // Assuming your type definitions are here
import *as d3 from "d3";
import { FastAverageColor, FastAverageColorResult } from 'fast-average-color'; // Import FastAverageColor

// Helper type for slice colors state
type SliceColors = Record<string, string>; // Key: icon URL or unique item ID, Value: hex color string

export default function SourceItemSunburstChart({
  data,
  sourceItemId,
}: {
  data: ProcessedItemData;
  sourceItemId: number;
}) {
  const { sourceItems /*, resultItems*/ } = data; // resultItems seems unused
  // Ensure sourceItems[sourceItemId] exists before trying to access it
  const initialSourceItem = sourceItems && sourceItems[sourceItemId] ? sourceItems[sourceItemId] : null;
  const [sourceItem, setSourceItem] = useState(initialSourceItem);

  console.log(sourceItem);

  // State to store the fetched average colors for each slice
  const [sliceColors, setSliceColors] = useState<SliceColors>({});

  const gArc = useRef<SVGGElement>(null);
  const gImage = useRef<SVGGElement>(null);
  const gText = useRef<SVGGElement>(null); // Added a ref for text elements for clarity

  // Update sourceItem if data or sourceItemId changes
  useEffect(() => {
    const newSourceItem = sourceItems && sourceItems[sourceItemId] ? sourceItems[sourceItemId] : null;
    setSourceItem(newSourceItem);
  }, [sourceItems, sourceItemId]);


  // Effect to fetch average colors when sourceItem changes
  useEffect(() => {
    if (!sourceItem || !sourceItem.contents || sourceItem.contents.length === 0) {
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
        const promise = fac.getColorAsync(contentItem.icon)
          .then((color: FastAverageColorResult) => {
            if (color.hex) {
              newColors[colorKey] = color.hex;
            } else {
              console.warn(`FastAverageColor did not return a hex for ${contentItem.icon}`);
              newColors[colorKey] = '#CCCCCC'; // Fallback color
            }
          })
          .catch((e) => {
            console.error(`Error getting average color for ${contentItem.icon}:`, e);
            newColors[colorKey] = '#CCCCCC'; // Fallback color on error
          });
        colorPromises.push(promise);
      } else {
        newColors[colorKey] = '#E0E0E0'; // Different fallback if no icon URL
      }
    });

    Promise.all(colorPromises).then(() => {
      setSliceColors(prevColors => ({ ...prevColors, ...newColors }));
    }).catch(error => {
      console.error("Error processing color promises:", error);
    });

    // Cleanup function for FastAverageColor instance if needed, though usually not for basic usage
    // return () => { fac.destroy(); };

  }, [sourceItem]); // Re-run when sourceItem changes

  // Effect to draw/update the D3 chart
  useEffect(() => {
    // Ensure refs are current and we have the necessary data
    if (!gArc.current || !gImage.current || !gText.current || !sourceItem || !sourceItem.contents || sourceItem.contents.length === 0) {
      // Clear previous drawings if data is not available
      d3.select(gArc.current).selectAll("*").remove();
      d3.select(gImage.current).selectAll("*").remove();
      d3.select(gText.current).selectAll("*").remove();
      return;
    }

    const width = 500; // Define SVG width
    const height = 500; // Define SVG height
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.5; // Example: for a donut chart
    const outerRadius = radius * 0.8;

    const pie = d3.pie<SourceItemContents>()
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
      .attr("d", d3.arc<d3.PieArcDatum<SourceItemContents>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
      )
      .attr("fill", (d) => {
        const colorKey = d.data.icon || d.data.name;
        return sliceColors[colorKey] || '#DDDDDD';
      })
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // Item Icons
    const iconSize = 30; // Adjust as needed
    d3.select(gImage.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .selectAll("image")
      .data(slices)
      .join("image")
      .attr("xlink:href", (d) => d.data.icon) // Ensure icons are accessible via URL
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("transform", (d) => {
        const [x, y] = d3.arc<d3.PieArcDatum<SourceItemContents>>()
            .innerRadius(innerRadius + (outerRadius - innerRadius) * 0.5) // Position in the middle of the arc
            .outerRadius(innerRadius + (outerRadius - innerRadius) * 0.5)
            .centroid(d);
        return `translate(${x - iconSize / 2}, ${y - iconSize / 2})`;
      })
      .style("pointer-events", "none")
      .style("display", (d) => (Math.abs(d.startAngle - d.endAngle) / (2 * Math.PI)) > 0.05 ? "block" : "none"); // So icons don't block tooltips on paths

    // Item Names (Labels)
    d3.select(gText.current)
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .selectAll("text")
      .data(slices)
      .join("text")
      .text((d) => d.data.name)
      .attr("transform", (d) => {
        const [x, y] = d3.arc<d3.PieArcDatum<SourceItemContents>>()
            .innerRadius(outerRadius + 5) // Position outside the arc
            .outerRadius(outerRadius + 5)
            .centroid(d);
        // Basic collision avoidance: if text is on left, anchor end, else anchor start
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        const textAnchor = (midAngle < Math.PI) ? "start" : "end";
        return `translate(${x}, ${y})`;
      })
      .style("text-anchor", (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return (midAngle < Math.PI) ? "start" : "end";
      })
      .style("font-size", "10px")
      .style("fill", "black"); // Or a theme-appropriate color

  }, [sourceItem, sliceColors]); // Re-run D3 effect when sourceItem or sliceColors change

  return (
    <svg width={500} height={500}> {/* Adjusted SVG size to match defined width/height */}
      <g ref={gArc}></g>
      <g ref={gImage}></g>
      <g ref={gText}></g>
    </svg>
  );
}
