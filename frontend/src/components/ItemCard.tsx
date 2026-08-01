import { SearchItem } from "../types";
import { cx, fmtPrice } from "../utils";

interface ItemCardProps {
  item: SearchItem;
  layout: "list" | "cards";
  hot: boolean;
  selected: boolean;
  onHover: (item: SearchItem | null) => void;
  onClick: (item: SearchItem) => void;
}

export function ItemCard({ item, layout, hot, selected, onHover, onClick }: ItemCardProps) {
  if (layout === "cards") {
    return (
      <button
        className={cx(
          "group flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-white/60 p-3 text-left transition-all duration-300 backdrop-blur-md",
          selected
            ? "border-black/30 bg-[#f4ecd6] shadow-[0_8px_30px_rgba(0,0,0,0.10)] scale-[1.02]"
            : "border-slate-200/50 shadow-sm hover:border-slate-300 hover:bg-white/90 hover:shadow-md hover:-translate-y-1"
        )}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(item)}
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
          <div className="aspect-[4/5] w-full">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-slate-200" />
            )}
          </div>
          
          <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
            {hot && (
              <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                NEW
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-2 px-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[18px] font-semibold tracking-tight text-slate-900">
              {fmtPrice(item.price.minor, item.price.currency)}
            </div>
            {item.size && (
              <span className="rounded-lg bg-[#dceeb1] px-2.5 py-1 text-xs font-bold text-black shadow-sm whitespace-nowrap">
                {item.size}
              </span>
            )}
          </div>
          <div className="line-clamp-2 text-sm font-semibold text-slate-600 leading-snug">
            {item.title}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
            {item.brand && (
              <span className="rounded-lg bg-slate-100/80 px-2 py-1 text-slate-600 shadow-sm border border-slate-200/50">
                {item.brand}
              </span>
            )}
            {item.condition && (
              <span className="rounded-lg bg-slate-100/80 px-2 py-1 text-slate-600 shadow-sm border border-slate-200/50 truncate max-w-[120px]">
                {item.condition}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // List layout
  return (
    <button
        className={cx(
          "group grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-300 backdrop-blur-md",
          selected
            ? "border-black/30 bg-[#f4ecd6] shadow-[0_4px_20px_rgba(0,0,0,0.10)] scale-[1.01] z-10 relative"
            : "border-slate-200/50 bg-white/60 shadow-sm hover:border-slate-300 hover:bg-white/90 hover:shadow-md"
        )}
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(item)}
    >
      <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100 shadow-inner">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-slate-200" />
        )}
      </div>

      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <div className="truncate text-[15px] font-semibold text-slate-800">
            {item.title}
          </div>
          {hot && (
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold text-black">
              NEW
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
          {item.brand && (
            <span className="flex items-center gap-1 rounded-md bg-slate-100/80 px-1.5 py-0.5 text-slate-600">
              <span className="text-slate-400">Brand:</span> {item.brand}
            </span>
          )}
          {item.size && (
            <span className="flex items-center gap-1 rounded-md bg-slate-100/80 px-1.5 py-0.5 text-slate-600">
              <span className="text-slate-400">Size:</span> {item.size}
            </span>
          )}
          {item.condition && (
            <span className="flex items-center gap-1 rounded-md bg-slate-100/80 px-1.5 py-0.5 text-slate-600">
              <span className="text-slate-400">Cond:</span> {item.condition}
            </span>
          )}
        </div>
      </div>

      <div className="text-right flex flex-col justify-center">
        <div className="text-lg font-semibold text-slate-900 tracking-tight">
          {fmtPrice(item.price.minor, item.price.currency)}
        </div>
      </div>
    </button>
  );
}
