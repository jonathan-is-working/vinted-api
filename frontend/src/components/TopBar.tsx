import React from "react";
import { Icon } from "./Icon";
import { cx } from "../utils";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (v: boolean) => void;
  q: string;
  setQ: (v: string) => void;
  runSearch: (page: number, append?: boolean) => void;
  loading: boolean;
  createAlertFromQuery: () => void;
  startLiveFeed: () => void;
  refreshNow: () => void;
  lastUpdatedAt: number | null;
  armedCount: number;
  streamItemsLength: number;
  activeView: "live" | "search";
  setActiveView: (v: "live" | "search") => void;
  activeFiltersLabel: string;
  layout: "list" | "cards";
  setLayout: (v: "list" | "cards") => void;
  openFilters: () => void;
  importVintedUrl: () => void;
}

export function TopBar({
  sidebarOpen,
  setSidebarOpen,
  inspectorOpen,
  setInspectorOpen,
  q,
  setQ,
  runSearch,
  loading,
  createAlertFromQuery,
  startLiveFeed,
  refreshNow,
  lastUpdatedAt,
  armedCount,
  streamItemsLength,
  activeView,
  setActiveView,
  activeFiltersLabel,
  layout,
  setLayout,
  openFilters,
  importVintedUrl
}: TopBarProps) {
  const updatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        {!sidebarOpen && (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar (b)"
          >
            <Icon name="menu_open" />
          </button>
        )}

        <div className="relative min-w-[240px] flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[20px]" />
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-3 py-2.5 text-sm text-black outline-none focus:border-black"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch(1, false);
            }}
          />
        </div>

        <button className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={!q.trim() || loading} onClick={() => runSearch(1, false)}>
          Search
        </button>
        <button className="rounded-full border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-black" onClick={openFilters}>
          Filters
        </button>
        <button className="rounded-full border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-black" onClick={importVintedUrl}>
          URL
        </button>
        <button className="rounded-full border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-black" onClick={createAlertFromQuery} disabled={!q.trim() || loading}>
          Arm
        </button>
        <button className="rounded-full bg-black px-3 py-2.5 text-sm font-semibold text-white" onClick={() => { setActiveView("live"); startLiveFeed(); }}>
          Live
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-black">
          <span className="rounded-full bg-[#dceeb1] px-2 py-1 font-semibold">Armed {armedCount}</span>
          <span className="rounded-full bg-[#c8e6cd] px-2 py-1 font-semibold">Feed {streamItemsLength}</span>
          <span className="rounded-full bg-[#f4ecd6] px-2 py-1 font-semibold">Updated {updatedLabel}</span>
          {!!activeFiltersLabel && <span className="rounded-full bg-black px-2 py-1 font-semibold text-white">{activeFiltersLabel}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full px-2.5 py-1.5 font-semibold bg-black text-white"
            onClick={() => setActiveView("live")}
          >
            Live
          </button>
          <button
            className={cx("rounded-full px-2.5 py-1.5 font-semibold", layout === "cards" ? "bg-black text-white" : "bg-white border border-neutral-300 text-black")}
            onClick={() => setLayout(layout === "cards" ? "list" : "cards")}
          >
            {layout === "cards" ? "List" : "Cards"}
          </button>
          <button className="rounded-full border border-neutral-300 bg-white px-2.5 py-1.5 font-semibold text-black" onClick={refreshNow}>
            Refresh
          </button>
          <button className={cx("rounded-full border px-2.5 py-1.5 font-semibold", inspectorOpen ? "border-neutral-300 bg-white text-black" : "border-neutral-300 bg-neutral-100 text-neutral-700")} onClick={() => setInspectorOpen(!inspectorOpen)}>
            Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
