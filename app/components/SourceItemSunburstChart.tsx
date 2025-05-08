import { useEffect, useRef, useState } from "react";
import {
  ProcessedItemData,
  ProcessedSourceItemData,
  SourceItemContents,
} from "../api/lib/types";
import * as d3 from "d3";

export default function SourceItemSunburstChart({
  data,
  sourceItemId,
}: {
  data: ProcessedItemData;
  sourceItemId: number;
}) {
  const { sourceItems, resultItems } = data;
  const [sourceItem, setSourceItem] = useState(sourceItems[sourceItemId]);

  const gArc = useRef(null);

  console.log(sourceItem.contents[0]);

  useEffect(() => {
    if(!gArc.current) return;

    const pie = d3.pie<SourceItemContents>().value((d) => d.valueContribution);

    const slices = pie(sourceItem.contents as unknown as Array<SourceItemContents>);

    d3.select(gArc.current)
        .selectAll("path")
        .data(slices)
        .join("path")
            .attr("transform", "translate(250, 250)")
            .attr("d", (d) => d3.arc()({
                innerRadius: 100,
                outerRadius: 200,
                startAngle: d.startAngle,
                endAngle: d.endAngle
            }))
            .attr("fill", "blue");

    d3.select(gArc.current)
        .selectAll("text")
        .data(slices)
        .join("text")
            .text((d) => d.data.name)
            .
  }, [sourceItem]);

  return (
    <svg width={700} height={500}>
      <g ref={gArc}></g>
    </svg>
  );
}
