import React from "react";
import { Icon } from "./Icon";
import { SearchResponse } from "../types";
import { cx } from "../utils";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (v: boolean) => void;
  q: string;
  setQ: (v: string) => void;
  runSearch: (page: number) => void;
  loading: boolean;
  createAlertFromQuery: () => void;
  startLiveFromQuery: () => void;
  liveMode: "saved" | "query" | "monitors";
  setLiveMode: (v: "saved" | "query" | "monitors") => void;
  refreshNow: () => void;
  lastUpdatedAt: number | null;
  selectedAlertId: string | null;
  armedCount: number;
  openArmedFeed: () => void;
  streamItemsLength: number;
  activeView: "live" | "search";
  setActiveView: (v: "live" | "search") => void;
  activeFiltersLabel: string;
  layout: "list" | "cards";
  setLayout: (v: "list" | "cards") => void;
  data: SearchResponse | null;
  page: number;
  perPage: number;
  setPerPage: (v: number) => void;
  canNext: boolean;
  openFilters: () => void;
  importVintedUrl: () => void;
}

export function TopBar({
  sidebarOpen, setSidebarOpen,
  inspectorOpen, setInspectorOpen,
  q, setQ, runSearch, loading, createAlertFromQuery, startLiveFromQuery, liveMode, setLiveMode,
  refreshNow, lastUpdatedAt,
  selectedAlertId, armedCount, openArmedFeed, streamItemsLength, activeView, setActiveView,
  activeFiltersLabel, layout, setLayout, data, page, perPage, setPerPage, canNext, openFilters
  , importVintedUrl
}: TopBarProps) {
  const updatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "—";

  return (
    <div className="sticky top-0 z-10 border-b border-white/40 bg-white/70 px-6 py-4 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center gap-4">
        {!sidebarOpen && (
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200/60 hover:bg-slate-50 text-slate-600 transition-all" 
            onClick={() => setSidebarOpen(true)} 
            title="Open sidebar (b)"
          >
            <Icon name="menu_open" />
          </button>
        )}
        
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" />
          <input
            className="w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-12 pr-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-normal"
            placeholder="Search for amazing deals... (e.g. nike dunk low, vintage levis)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch(1);
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 border border-slate-200">
              <Icon name="keyboard_return" className="text-[12px]" /> Enter
            </kbd>
          </div>
        </div>

        <button 
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!q.trim() || loading} 
          onClick={() => runSearch(1)}
        >
          {loading ? <Icon name="sync" className="animate-spin" /> : <Icon name="search" />} 
          Search
        </button>

        <button
          className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/60 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          onClick={refreshNow}
          title="Refresh now"
        >
          <Icon name="refresh" /> Refresh
        </button>

        <button
          className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/60 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          onClick={openFilters}
          title="Open filters"
        >
          <Icon name="tune" /> Filters
        </button>

        <button
          className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/60 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          onClick={importVintedUrl}
          title="Import filters from a Vinted URL"
        >
          <Icon name="travel_explore" /> Import URL
        </button>
        
        <button
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-5 py-3 text-sm font-bold shadow-sm hover:bg-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!q.trim() || loading}
          onClick={createAlertFromQuery}
          title="Create & arm a live alert for this query"
        >
          <Icon name="notifications_active" /> Arm Monitor
        </button>

        <button
          className={cx(
            "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            liveMode === "query"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white text-slate-700 border border-slate-200/60 hover:bg-slate-50"
          )}
          disabled={!q.trim()}
          onClick={() => {
            setLiveMode("query");
            setActiveView("live");
            startLiveFromQuery();
          }}
          title="Subscribe to the current query (SSE) and get new items in real-time"
        >
          <Icon name="wifi_tethering" /> Live Query
        </button>

        <button
          className={cx(
            "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-sm transition-all",
            liveMode === "monitors"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white text-slate-700 border border-slate-200/60 hover:bg-slate-50"
          )}
          onClick={openArmedFeed}
          title="Subscribe to all armed monitors"
        >
          <Icon name="insights" /> Armed alerts{armedCount ? ` (${armedCount})` : ""}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
            (liveMode === "query" || liveMode === "monitors" || selectedAlertId)
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-slate-200/50 text-slate-500"
          )}>
            <div
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                liveMode === "query" || liveMode === "monitors" || selectedAlertId
                  ? "bg-white animate-pulse"
                  : "bg-slate-400"
              )}
            />
            Monitor:{" "}
            {liveMode === "query"
              ? "Query"
              : liveMode === "monitors"
                ? "Armed"
              : selectedAlertId
                ? "Saved"
                : "Idle"}
          </span>
          
          <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/60 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
            <Icon name="feed" className="text-[14px] text-slate-400" />
            Feed: {streamItemsLength}
          </span>

          <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/60 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
            <Icon name="schedule" className="text-[14px] text-slate-400" />
            Updated: {updatedLabel}
          </span>
          
          {!!activeFiltersLabel && (
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <Icon name="filter_list" className="text-[14px]" />
              {activeFiltersLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggles */}
          <div className="flex rounded-xl bg-slate-100/80 p-1 shadow-inner border border-slate-200/50">
            <button
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                layout === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
              onClick={() => setLayout("list")}
            >
              <Icon name="view_list" className="text-[16px]" /> List
            </button>
            <button
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                layout === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
              onClick={() => setLayout("cards")}
            >
              <Icon name="grid_view" className="text-[16px]" /> Cards
            </button>
          </div>

          {/* Mode Toggles */}
          <div className="flex rounded-xl bg-slate-100/80 p-1 shadow-inner border border-slate-200/50">
            <button
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeView === "live" ? "bg-white text-emerald-700 shadow-sm border border-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
              onClick={() => setActiveView("live")}
            >
              <Icon name="bolt" className="text-[16px]" /> Live Feed
            </button>
            <button
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50",
                activeView === "search" ? "bg-white text-blue-700 shadow-sm border border-blue-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
              onClick={() => setActiveView("search")}
              disabled={!data}
            >
              <Icon name="travel_explore" className="text-[16px]" /> Search
            </button>
          </div>

          {/* Pagination */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={() => runSearch(Math.max(1, page - 1))}
              disabled={loading || !data || page <= 1}
            >
              <Icon name="chevron_left" />
            </button>
            <div className="flex items-center justify-center h-8 px-3 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              Page {activeView === "search" ? page : "—"}
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={() => runSearch(page + 1)}
              disabled={loading || !canNext}
            >
              <Icon name="chevron_right" />
            </button>
            
            <select
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer hover:bg-slate-50"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              title="Results per page"
            >
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
            </select>
          </div>

          <button 
            className={cx(
              "hidden lg:flex h-10 w-10 items-center justify-center rounded-xl shadow-sm border transition-all",
              inspectorOpen 
                ? "bg-white border-slate-200/60 hover:bg-slate-50 text-emerald-600" 
                : "bg-slate-100 border-slate-200/60 hover:bg-slate-200 text-slate-400"
            )}
            onClick={() => setInspectorOpen(!inspectorOpen)} 
            title="Toggle Inspector Preview"
          >
            <Icon name="info" />
          </button>
        </div>
      </div>
    </div>
  );
}
