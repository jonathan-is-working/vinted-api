import React from "react";
import { SearchItem, ItemDetails } from "../types";
import { cx, fmtPrice } from "../utils";
import { Icon } from "./Icon";

interface InspectorDrawerProps {
  selectedItem: SearchItem | null;
  details: ItemDetails | null;
  detailsLoading: boolean;
  onClose: () => void;
}

export function InspectorDrawer({
  selectedItem, details, detailsLoading, onClose
}: InspectorDrawerProps) {
  const item = selectedItem;
  if (!item) return null;

  return (
    <aside 
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[82dvh] flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl lg:static lg:h-full lg:max-h-none lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:bg-white/90 lg:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] lg:backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/50 bg-white/50 sm:px-6 sm:py-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">
            Article
          </div>
          <div className="text-[15px] font-bold text-slate-800 line-clamp-1">{item.title}</div>
        </div>
        <div className="flex items-center gap-2">
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              Open <Icon name="open_in_new" className="text-[14px]" />
            </a>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:h-auto lg:w-auto lg:gap-1.5 lg:px-3 lg:py-1.5"
          >
            <Icon name="close" className="text-[14px]" />
            <span className="hidden lg:inline">Fermer</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-6">
          <div className="grid gap-4 sm:gap-6">
            
            {/* Main Info Card */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="flex gap-4 sm:flex-col sm:gap-5">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-inner sm:h-48 sm:w-full">
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
                    <div className="text-base font-bold text-slate-900 leading-snug sm:text-lg">
                      {item.title}
                    </div>
                    <div className="text-lg font-black text-slate-900 shrink-0 sm:text-xl">
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
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="description" className="text-slate-400 text-[18px]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Description
                  </h3>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Selected</span>
              </div>

              {detailsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
                  {details?.description?.trim()
                    ? details.description.trim()
                    : <span className="italic text-slate-400">No description provided for this item.</span>}
                </div>
              )}
            </div>
          </div>
      </div>
    </aside>
  );
}
