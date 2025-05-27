import SourceItemDivergingBarChart from "../SourceItemDivergingBarChart";
import type { ProcessedItemData } from "../../api/lib/types";

interface OverviewPageProps {
  data: ProcessedItemData;
  onSourceItemClick: (sourceItemId: number) => void;
}

export default function OverviewPage({
  data,
  onSourceItemClick,
}: OverviewPageProps) {
  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-6 pb-20 gap-12 sm:p-16">
      <SourceItemDivergingBarChart
        data={data}
        onSourceItemClick={onSourceItemClick}
      />
    </div>
  );
}
