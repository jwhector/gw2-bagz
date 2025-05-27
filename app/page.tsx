"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OverviewPage from "./components/pages/OverviewPage";
import BreakdownPage from "./components/pages/BreakdownPage";
import type { ProcessedItemData } from "./api/lib/types";

type ViewState = "overview" | "breakdown" | "transitioning";

// Separate component that uses useSearchParams
function PageContent() {
  const [data, setData] = useState<ProcessedItemData | null>(null);
  const [viewState, setViewState] = useState<ViewState>("overview");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get sourceItemId from URL
  const sourceItemId = searchParams.get("item")
    ? parseInt(searchParams.get("item")!)
    : null;

  const onSourceItemClick = (sourceItemId: number) => {
    console.log("Source item clicked:", sourceItemId);
    router.push(`/?item=${sourceItemId}`, { scroll: false });
  };

  const onBackToOverview = () => {
    router.push("/", { scroll: false });
  };

  // Handle browser back/forward navigation and URL changes
  useEffect(() => {
    const currentSourceItemId = searchParams.get("item")
      ? parseInt(searchParams.get("item")!)
      : null;

    if (currentSourceItemId) {
      setViewState("breakdown");
    } else {
      setViewState("overview");
    }
  }, [searchParams]);

  // Initialize view state based on URL on mount
  useEffect(() => {
    if (sourceItemId) {
      setViewState("breakdown");
    } else {
      setViewState("overview");
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/api/items/test").then((res) => {
      if (res.ok) {
        res.json().then(setData);
      }
    });
  }, []);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Overview View */}
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          viewState === "overview"
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {viewState === "overview" && data && (
          <OverviewPage data={data} onSourceItemClick={onSourceItemClick} />
        )}
      </div>

      {/* Breakdown View */}
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          viewState === "breakdown"
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {viewState === "breakdown" && data && sourceItemId && (
          <BreakdownPage
            data={data}
            sourceItemId={sourceItemId}
            onBackToOverview={onBackToOverview}
          />
        )}
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function PageLoading() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PageContent />
    </Suspense>
  );
}
