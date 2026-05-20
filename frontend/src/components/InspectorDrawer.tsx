import React from "react";
import { SearchItem, ItemDetails } from "../types";
import { cx, fmtPrice } from "../utils";
import { Icon } from "./Icon";

interface InspectorDrawerProps {
  item: SearchItem | null;
  selectedItem: SearchItem | null;
  details: ItemDetails | null;
  detailsLoading: boolean;
  detailsError: string | null;
  onClose: () => void;
  activeView: "live" | "search";
}

export function InspectorDrawer({
  item, selectedItem, details, detailsLoading, detailsError, onClose, activeView
}: InspectorDrawerProps) {
  const isPinned = selectedItem?.id === item?.id;

  return (
    <aside 
      className="hidden lg:flex flex-col h-full w-[400px] shrink-0 bg-white/90 backdrop-blur-2xl border-l border-slate-200/60 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 bg-white/50">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
            Inspector
          </div>
          <div className="text-[15px] font-bold text-slate-800 line-clamp-1">
            {item ? item.title : "Hover or select an item"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item?.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              Open <Icon name="open_in_new" className="text-[14px]" />
            </a>
          )}
          {isPinned && (
            <button 
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200/80 text-slate-500 transition-colors"
            >
              <Icon name="close" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {!item ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 mb-4 shadow-inner">
              <Icon name="preview" className="text-[32px]" />
            </div>
            <p className="text-sm">Hover over an item to see a quick preview.<br/>Click to pin it and fetch details.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            
            {/* Main Info Card */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-5">
                <div className="h-48 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-slate-200" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="text-lg font-bold text-slate-900 leading-snug">
                      {item.title}
                    </div>
                    <div className="text-xl font-black text-slate-900 shrink-0">
                      {fmtPrice(item.price.minor, item.price.currency)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.brand && (
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                        {item.brand}
                      </span>
                    )}
                    {item.size && (
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {item.size}
                      </span>
                    )}
                    {item.condition && (
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {item.condition}
                      </span>
                    )}
                    <span className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                      #{item.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="description" className="text-slate-400 text-[18px]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Description
                  </h3>
                </div>
                {isPinned ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Pinned
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    Preview
                  </span>
                )}
              </div>

              {!isPinned ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center text-sm text-slate-500">
                  Click the item card to fetch full description details.
                </div>
              ) : detailsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                </div>
              ) : detailsError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
                  {detailsError}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
                  {details?.description?.trim()
                    ? details.description.trim()
                    : <span className="italic text-slate-400">No description provided for this item.</span>}
                </div>
              )}
            </div>

            {/* Market Intelligence */}
            <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-lg relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Icon name="insights" className="text-emerald-400 text-[18px]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Market Intel
                </h3>
              </div>
              
              <div className="grid gap-3 relative z-10">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-xs font-medium text-slate-400">Signal Type</span>
                  <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md">
                    {item.brand ? "Branded Match" : "Generic Match"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-xs font-medium text-slate-400">Discovery</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                    {activeView === "live" ? <><Icon name="bolt" className="text-[14px]"/> Live Feed</> : "Manual Search"}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 font-medium leading-relaxed">
                  <span className="text-emerald-400 font-bold">Pro-tip:</span> If this is a profitable item, refine your filters using the same brand ({item.brand || "N/A"}) and arm a new monitor.
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </aside>
  );
}
