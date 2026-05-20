export function SkeletonRow() {
  return (
    <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-2xl bg-white/50 px-4 py-3 shadow-sm backdrop-blur border border-white/40 mb-2 animate-pulse">
      <div className="h-12 w-12 rounded-xl bg-slate-200/60" />
      <div className="grid gap-3">
        <div className="h-3.5 w-2/3 rounded-lg bg-slate-200/60" />
        <div className="h-3 w-1/3 rounded-lg bg-slate-200/60" />
      </div>
      <div className="h-6 w-16 rounded-lg bg-slate-200/60" />
    </div>
  );
}
