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
          "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white/75 p-1.5 text-left transition-all duration-300 sm:rounded-3xl sm:p-3 sm:backdrop-blur-md",
          selected
            ? "border-blue-300 bg-blue-50/80 shadow-[0_8px_30px_rgb(59,130,246,0.12)] scale-[1.02]"
            : "border-slate-200 bg-white/85 shadow-sm hover:border-blue-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
        )}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(item)}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-100 sm:rounded-2xl sm:shadow-inner">
          <div className="aspect-[3/4] w-full sm:aspect-[4/5]">
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
          
          <div className="pointer-events-none absolute left-2 top-2 flex gap-2 sm:left-3 sm:top-3">
            {hot && (
              <span className="rounded-full bg-blue-600/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-md sm:px-2.5 sm:py-1 sm:text-[10px]">
                NOUVEAU
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-1 flex-col gap-1.5 px-1 sm:mt-4 sm:gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-bold tracking-tight text-slate-900 sm:text-[18px]">
              {fmtPrice(item.price.minor, item.price.currency)}
            </div>
            {item.size && (
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 whitespace-nowrap sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
                {item.size}
              </span>
            )}
          </div>
          <div className="line-clamp-2 text-[12px] font-medium leading-snug text-slate-700 sm:text-sm sm:font-semibold sm:text-slate-600">
            {item.title}
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-500 sm:gap-2 sm:text-[11px]">
            {item.brand && (
              <span className="max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600 sm:rounded-lg sm:px-2 sm:py-1 sm:shadow-sm sm:border sm:border-slate-200/50">
                {item.brand}
              </span>
            )}
            {item.condition && (
              <span className="hidden rounded-lg bg-slate-100/80 px-2 py-1 text-slate-600 shadow-sm border border-slate-200/50 truncate max-w-[120px] sm:inline">
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
          ? "border-blue-300 bg-blue-50/80 shadow-[0_4px_20px_rgb(59,130,246,0.08)] scale-[1.01] z-10 relative"
          : "border-slate-200 bg-white/85 shadow-sm hover:border-blue-200 hover:bg-white hover:shadow-md"
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
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
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
        <div className="text-lg font-bold text-slate-900 tracking-tight">
          {fmtPrice(item.price.minor, item.price.currency)}
        </div>
      </div>
    </button>
  );
}
