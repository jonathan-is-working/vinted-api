import React from "react";
import { Icon } from "./Icon";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  q: string;
  setQ: (value: string) => void;
  runSearch: (page: number) => void;
  loading: boolean;
  createAlertFromQuery: () => void;
  startLiveFeed: () => void;
  armedCount: number;
  openFilters: () => void;
  importVintedUrl: () => void;
  telegramProfilesCount: number;
  openTelegramProfiles: () => void;
}

export function TopBar({
  sidebarOpen,
  setSidebarOpen,
  q,
  setQ,
  runSearch,
  loading,
  createAlertFromQuery,
  startLiveFeed,
  armedCount,
  openFilters,
  importVintedUrl,
  telegramProfilesCount,
  openTelegramProfiles
}: TopBarProps) {
  const canUseQuery = Boolean(q.trim());

  const searchInput = (
    <div className="relative flex-1">
      <Icon name="search" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
      <input
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
        placeholder="Rechercher sur Vinted"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void runSearch(1);
        }}
      />
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-xl sm:hidden">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-sm font-medium tracking-[-0.03em] text-slate-900">Friply</button>
          <div className="flex items-center gap-1">
            <button onClick={openTelegramProfiles} className="grid size-9 place-items-center rounded-full text-slate-600" aria-label="Profils Telegram"><Icon name="notifications_active" className="size-5" /></button>
            <button onClick={() => setSidebarOpen(true)} className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Mes alertes"><Icon name="menu_open" className="size-5" /></button>
          </div>
        </div>
        {searchInput}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          <button onClick={openFilters} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">Filtres</button>
          <button onClick={importVintedUrl} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">Lien Vinted</button>
          <button onClick={createAlertFromQuery} disabled={!canUseQuery || loading} className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 disabled:opacity-40">Créer l&apos;alerte</button>
          <button onClick={startLiveFeed} disabled={!canUseQuery && armedCount === 0} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40">Démarrer le live</button>
        </div>
      </header>

      <header className="sticky top-0 z-10 hidden border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur-xl sm:block">
        <div className="flex items-center gap-2.5">
          {!sidebarOpen ? <button className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir les alertes"><Icon name="menu_open" /></button> : null}
          {searchInput}
          <button onClick={() => runSearch(1)} disabled={!canUseQuery || loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40">
            {loading ? <Icon name="sync" className="animate-spin" /> : <Icon name="search" />} Rechercher
          </button>
          <button onClick={openFilters} className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" title="Filtres"><Icon name="tune" /></button>
          <button onClick={importVintedUrl} className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" title="Importer un lien Vinted"><Icon name="travel_explore" /></button>
          <button onClick={openTelegramProfiles} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"><Icon name="notifications_active" /> Telegram{telegramProfilesCount ? ` (${telegramProfilesCount})` : ""}</button>
          <button onClick={createAlertFromQuery} disabled={!canUseQuery || loading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40"><Icon name="add" /> Alerte</button>
          <button onClick={startLiveFeed} disabled={!canUseQuery && armedCount === 0} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"><Icon name="wifi_tethering" /> Live</button>
        </div>
      </header>
    </>
  );
}
