import React from "react";
import { Alert } from "../types";
import { cx } from "../utils";
import { Icon, type IconName } from "./Icon";

interface SidebarProps {
  open: boolean;
  setOpen: (v: boolean) => void;

  // Alerts
  alertsLoading: boolean;
  alerts: Alert[];
  alertsError: string | null;
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  liveMode: "saved" | "query" | "monitors";
  selectMonitors: () => void;
  armedAlertIds: string[];
  setArmedAlertIds: React.Dispatch<React.SetStateAction<string[]>>;
  streamError: string | null;
  deleteAlert: (id: string) => void;
  onEditAlert: (id: string) => void;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
      {children}
    </span>
  );
}

function minorToPriceLabel(minor: number, currency: string) {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function formatAlertSummary(a: Alert): string {
  const q = a.query?.q ?? "";
  const currency = a.query?.currency ?? "EUR";
  const parts: string[] = [];

  if (typeof a.query?.priceMin === "number") parts.push(`min ${minorToPriceLabel(a.query.priceMin, currency)}`);
  if (typeof a.query?.priceMax === "number") parts.push(`max ${minorToPriceLabel(a.query.priceMax, currency)}`);

  const countArr = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const sizesCount =
    countArr(a.query?.sizeIds4) +
    countArr(a.query?.sizeIds7) +
    countArr(a.query?.sizeIds53) +
    countArr(a.query?.sizeIds64) +
    countArr(a.query?.sizeIds14) +
    countArr(a.query?.sizeIds38) +
    countArr(a.query?.sizeIds52) +
    countArr(a.query?.sizeIds60) +
    countArr(a.query?.sizeIds61) +
    countArr(a.query?.sizeIds62) +
    countArr(a.query?.sizeIds63) +
    countArr(a.query?.sizeIds73) +
    countArr(a.query?.sizeIds74) +
    countArr(a.query?.sizeIds75) +
    countArr(a.query?.sizeIds77);
  if (sizesCount) parts.push(`sizes ${sizesCount}`);

  const brands = countArr(a.query?.brandIds);
  if (brands) parts.push(`brands ${brands}`);
  const statuses = countArr(a.query?.statusIds);
  if (statuses) parts.push(`cond ${statuses}`);

  return `${q}${parts.length ? ` • ${parts.join(" • ")}` : ""}`;
}

function Section({
  title,
  icon,
  badge,
  defaultOpen,
  children
}: {
  title: string;
  icon: IconName;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-slate-200/60 bg-white/55 shadow-sm backdrop-blur"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <Icon name={icon} className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-bold uppercase tracking-wider text-slate-700">
            {title}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
        <div className="shrink-0 text-slate-400 transition-transform group-open:rotate-90">
          <Icon name="chevron_right" className="text-[20px]" />
        </div>
      </summary>
      <div className="border-t border-slate-200/50 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

export function Sidebar(props: SidebarProps) {
  const {
    open,
    setOpen,
    alertsLoading,
    alerts,
    alertsError,
    selectedAlertId,
    setSelectedAlertId,
    liveMode,
    selectMonitors,
    armedAlertIds,
    setArmedAlertIds,
    streamError,
    deleteAlert,
    onEditAlert,
    // filters are now in a popup modal; keep sidebar clean
  } = props;

  if (!open) return null;

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col overflow-x-hidden border-r border-white/40 bg-white/70 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all z-20">
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md">
            <Icon name="radar" className="text-white text-[24px]" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-800 tracking-tight">VintedRadar</div>
            <div className="text-[11px] font-medium text-emerald-600/80 uppercase tracking-wider">
              Live Monitor
            </div>
          </div>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          onClick={() => setOpen(false)}
          title="Collapse sidebar (b)"
        >
          <Icon name="keyboard_tab_rtl" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar space-y-3">
        <Section
          title="Saved Searches"
          icon="bookmark"
          defaultOpen
          badge={alerts.length ? <Badge>{alerts.length}</Badge> : undefined}
        >
          <div className="grid gap-2">
            <button
              className={cx(
                "group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                liveMode === "monitors"
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-slate-200/60 bg-white/70 hover:bg-white"
              )}
              onClick={selectMonitors}
              title="Subscribe to multiple armed monitors at once"
            >
              <div
                className={cx(
                  "h-2 w-2 rounded-full",
                  liveMode === "monitors" ? "bg-emerald-500" : "bg-slate-300 group-hover:bg-slate-400"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold text-slate-900">Armed alerts</div>
                <div className="mt-0.5 truncate text-[10px] text-slate-500">
                  {armedAlertIds.length
                    ? `${armedAlertIds.length} armed • toggle ✓ to disarm`
                    : "arm at least one monitor (use +)"}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1 text-slate-400">
                <Icon name="insights" className="text-[18px]" />
              </div>
            </button>

            {alertsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-9 rounded-xl bg-slate-200/70" />
                <div className="h-9 rounded-xl bg-slate-200/70" />
              </div>
            ) : alerts.length ? (
              alerts.map((a) => {
                const active = selectedAlertId === a.id;
                const armed = armedAlertIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={cx(
                      "group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                      active
                        ? "border-emerald-300 bg-emerald-50/70"
                        : "border-slate-200/60 bg-white/70 hover:bg-white"
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAlertId(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAlertId(a.id);
                      }
                    }}
                  >
                    <button
                      className={cx(
                        "flex h-6 w-6 items-center justify-center rounded-md border transition",
                        armed
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white/80 text-slate-400 hover:bg-white"
                      )}
                      title={armed ? "Disarm" : "Arm"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setArmedAlertIds((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        );
                      }}
                    >
                      <Icon name={armed ? "check" : "add"} className="text-[16px]" />
                    </button>
                    <div
                      className={cx(
                        "h-2 w-2 rounded-full",
                        active ? "bg-emerald-500" : "bg-slate-300 group-hover:bg-slate-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="whitespace-normal break-words text-[12px] font-bold text-slate-900 leading-snug">
                        {a.name || a.id.slice(0, 8)}
                      </div>
                      <div className="mt-0.5 whitespace-normal break-words text-[10px] text-slate-500 leading-snug">
                        every {a.pollIntervalSeconds}s • {formatAlertSummary(a)}
                      </div>
                    </div>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      title="Edit filters"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAlert(a.id);
                      }}
                    >
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAlert(a.id);
                      }}
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-center text-[12px] text-slate-600">
                No monitors yet. Search, then click “Arm alert”.
              </div>
            )}

            {alertsError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
                {alertsError}
              </div>
            )}
            {streamError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                {streamError}
              </div>
            )}

            {armedAlertIds.length ? (
              <button
                className="mt-1 w-full rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-white transition"
                onClick={() => setArmedAlertIds([])}
                title="Clear armed selection (will re-arm all on next reload if none are armed)"
              >
                Clear armed selection
              </button>
            ) : null}
          </div>
        </Section>
      </div>
    </aside>
  );
}
