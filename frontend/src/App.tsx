import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ItemCard } from "./components/ItemCard";
import { InspectorDrawer } from "./components/InspectorDrawer";
import { SkeletonRow } from "./components/SkeletonRow";
import { Icon } from "./components/Icon";
import { FiltersModal } from "./components/FiltersModal";
import { api, API_BASE_URL } from "./api";
import { SIZE_PRESETS } from "./sizePresets";
import {
  SearchItem,
  SearchResponse,
  CatalogOption,
  CatalogCategory,
  CatalogFiltersResponse,
  CatalogOptionsResponse,
  CatalogFacetResponse,
  ItemDetails,
  Alert,
  AlertEvent
} from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<"live" | "search">("live");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [layout, setLayout] = useState<"list" | "cards">("cards");
  const [liveMode, setLiveMode] = useState<"saved" | "query" | "monitors">("saved");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; url: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevance" | "newest" | "price_asc" | "price_desc">("newest");
  const [currency, setCurrency] = useState("EUR");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(24);

  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandSelected, setBrandSelected] = useState<CatalogOption[]>([]);

  const [sizeSelectedWomen, setSizeSelectedWomen] = useState<CatalogOption[]>([]);
  const [sizeSelectedWomenShoes, setSizeSelectedWomenShoes] = useState<CatalogOption[]>([]);
  const [sizeSelectedBras, setSizeSelectedBras] = useState<CatalogOption[]>([]);
  const [sizeSelectedWomenBelts, setSizeSelectedWomenBelts] = useState<CatalogOption[]>([]);
  const [sizeSelectedMen, setSizeSelectedMen] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenShoes, setSizeSelectedMenShoes] = useState<CatalogOption[]>([]);
  const [sizeSelectedRings, setSizeSelectedRings] = useState<CatalogOption[]>([]);
  const [sizeSelectedAdultHats, setSizeSelectedAdultHats] = useState<CatalogOption[]>([]);
  const [sizeSelectedAdultGloves, setSizeSelectedAdultGloves] = useState<CatalogOption[]>([]);
  const [sizeSelectedWatches, setSizeSelectedWatches] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenBelts, setSizeSelectedMenBelts] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenSocks, setSizeSelectedMenSocks] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenShirts, setSizeSelectedMenShirts] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenSuitJackets, setSizeSelectedMenSuitJackets] = useState<CatalogOption[]>([]);
  const [sizeSelectedMenPants, setSizeSelectedMenPants] = useState<CatalogOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<CatalogOption[]>([]);
  const [statusSelected, setStatusSelected] = useState<CatalogOption[]>([]);
  const [colorSelected, setColorSelected] = useState<CatalogOption[]>([]);
  const [materialSelected, setMaterialSelected] = useState<CatalogOption[]>([]);
  const [facetBrands, setFacetBrands] = useState<CatalogFacetResponse["options"]>([]);
  const [facetSizes, setFacetSizes] = useState<CatalogFacetResponse["options"]>([]);
  const [facetStatuses, setFacetStatuses] = useState<CatalogFacetResponse["options"]>([]);
  const [facetColors, setFacetColors] = useState<CatalogFacetResponse["options"]>([]);
  const [facetMaterials, setFacetMaterials] = useState<CatalogFacetResponse["options"]>([]);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [armedInit] = useState(() => {
    try {
      return localStorage.getItem("armedAlertIds") != null;
    } catch {
      return false;
    }
  });
  const [armedAlertIds, setArmedAlertIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("armedAlertIds");
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  });
  const [streamItems, setStreamItems] = useState<SearchItem[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const liveModeRef = useRef(liveMode);
  const armedIdsRef = useRef<string[]>(armedAlertIds);

  const [hovered, setHovered] = useState<SearchItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [details, setDetails] = useState<ItemDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const items = useMemo(() => {
    return activeView === "live" ? streamItems : data?.items ?? [];
  }, [activeView, data?.items, streamItems]);

  const canNext = useMemo(() => {
    if (!data) return false;
    if (data.totalPages == null) return data.items.length > 0;
    return data.page < data.totalPages;
  }, [data]);

  const categoryOptions = useMemo(() => {
    const byParent = new Map<number | null, CatalogCategory[]>();
    for (const c of categories) {
      const list = byParent.get(c.parentId) ?? [];
      list.push(c);
      byParent.set(c.parentId, list);
    }
    for (const list of byParent.values()) list.sort((a, b) => a.title.localeCompare(b.title));
    const out: Array<{ id: number; label: string }> = [];
    const walk = (parentId: number | null, prefix: string) => {
      const kids = byParent.get(parentId) ?? [];
      for (const k of kids) {
        out.push({ id: k.id, label: `${prefix}${k.title}` });
        walk(k.id, `${prefix}${k.title} › `);
      }
    };
    walk(null, "");
    return out;
  }, [categories]);

  // Size presets (women + men can be combined) are handled in the sidebar UI.

  const activeFiltersLabel = useMemo(() => {
    const parts: string[] = [];
    if (sort !== "newest") parts.push(`sort:${sort}`);
    if (categoryId) parts.push(`cat:${categoryId}`);
    if (brandSelected.length) parts.push(`brands:${brandSelected.length}`);
    if (statusSelected.length) parts.push(`status:${statusSelected.length}`);
    if (priceMin.trim()) parts.push(`min€:${priceMin.trim()}`);
    if (priceMax.trim()) parts.push(`max€:${priceMax.trim()}`);
    return parts.join(" • ");
  }, [brandSelected.length, categoryId, priceMax, priceMin, sort, statusSelected.length]);

  async function loadAlerts() {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const list = await api<Alert[]>("/v1/alerts");
      setAlerts(list);
      if (!selectedAlertId && list[0]?.id) setSelectedAlertId(list[0].id);
      // Keep armed ids in-sync with existing alerts (prevents stale counts after DB reset / deletions).
      setArmedAlertIds((prev) => {
        const existing = new Set(list.map((a) => a.id));
        const cleaned = prev.filter((id) => existing.has(id));
        if (cleaned.length) return cleaned;
        // Only auto-arm on the very first run (when there is no localStorage state yet).
        if (!armedInit) return list.map((a) => a.id);
        return [];
      });
    } catch (e) {
      setAlertsError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAlertsLoading(false);
    }
  }

  function mapSizeIdsToOptions(ids: unknown, preset: keyof typeof SIZE_PRESETS): CatalogOption[] {
    if (!Array.isArray(ids)) return [];
    const dict = new Map<number, string>(SIZE_PRESETS[preset].options.map((o) => [o.id, o.title]));
    const out: CatalogOption[] = [];
    for (const raw of ids) {
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      out.push({ id: n, title: dict.get(n) ?? String(n) });
    }
    return out;
  }

  function loadFiltersFromAlert(alert: Alert) {
    setQ(alert.query?.q ?? "");
    setCurrency(alert.query?.currency ?? "EUR");
    setPerPage(alert.query?.perPage ?? 24);
    setSort("newest");
    setCategoryId(alert.query?.catalogIds?.[0] ? String(alert.query.catalogIds[0]) : "");
    setBrandSelected((prev) => {
      const ids = alert.query?.brandIds ?? [];
      return ids.map((id) => ({ id, title: `#${id}` }));
    });
    setStatusSelected((prev) => (alert.query?.statusIds ?? []).map((id) => ({ id, title: `#${id}` })));
    setColorSelected((prev) => (alert.query?.colorIds ?? []).map((id) => ({ id, title: `#${id}` })));
    setMaterialSelected((prev) => (alert.query?.materialIds ?? []).map((id) => ({ id, title: `#${id}` })));

    setSizeSelectedWomen(mapSizeIdsToOptions(alert.query?.sizeIds4, "women_clothing"));
    setSizeSelectedWomenShoes(mapSizeIdsToOptions(alert.query?.sizeIds7, "women_shoes"));
    setSizeSelectedBras(mapSizeIdsToOptions(alert.query?.sizeIds53, "bras"));
    setSizeSelectedWomenBelts(mapSizeIdsToOptions(alert.query?.sizeIds64, "women_belts"));
    setSizeSelectedMen(mapSizeIdsToOptions(alert.query?.sizeIds14, "men_clothing"));
    setSizeSelectedMenShoes(mapSizeIdsToOptions(alert.query?.sizeIds38, "men_shoes"));
    setSizeSelectedRings(mapSizeIdsToOptions(alert.query?.sizeIds52, "rings"));
    setSizeSelectedAdultHats(mapSizeIdsToOptions(alert.query?.sizeIds60, "adult_hats"));
    setSizeSelectedAdultGloves(mapSizeIdsToOptions(alert.query?.sizeIds61, "adult_gloves"));
    setSizeSelectedWatches(mapSizeIdsToOptions(alert.query?.sizeIds62, "watches"));
    setSizeSelectedMenBelts(mapSizeIdsToOptions(alert.query?.sizeIds63, "men_belts"));
    setSizeSelectedMenSocks(mapSizeIdsToOptions(alert.query?.sizeIds73, "men_socks"));
    setSizeSelectedMenShirts(mapSizeIdsToOptions(alert.query?.sizeIds74, "men_shirts"));
    setSizeSelectedMenSuitJackets(mapSizeIdsToOptions(alert.query?.sizeIds75, "men_suit_jackets"));
    setSizeSelectedMenPants(mapSizeIdsToOptions(alert.query?.sizeIds77, "men_pants"));

    setPriceMin(alert.query?.priceMin != null ? String((alert.query.priceMin / 100).toFixed(2)) : "");
    setPriceMax(alert.query?.priceMax != null ? String((alert.query.priceMax / 100).toFixed(2)) : "");
  }

  function importFiltersFromVintedUrl() {
    const raw = window.prompt("Paste a Vinted catalog URL");
    if (!raw) return;
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(raw.trim());
    } catch {
      setError("Invalid URL");
      return;
    }

    const params = parsedUrl.searchParams;
    const getIds = (key: string) =>
      [
        ...params.getAll(key),
        ...params.getAll(`${key}[]`)
      ]
        .flatMap((v) => v.split(","))
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);

    const sizeIds = Array.from(new Set(getIds("size_ids")));
    const statusIds = Array.from(new Set(getIds("status_ids")));
    const brandIds = Array.from(new Set(getIds("brand_ids")));
    const colorIds = Array.from(new Set(getIds("color_ids")));
    const materialIds = Array.from(new Set(getIds("material_ids")));
    const catalogIds = Array.from(new Set(getIds("catalog")));
    const catalogIdsAlt = Array.from(new Set(getIds("catalog_ids")));

    const toOptions = (ids: number[], dict: Record<number, string>) =>
      ids
        .filter((id) => dict[id] != null)
        .map((id) => ({ id, title: dict[id] ?? String(id) }));

    setQ(params.get("search_text") ?? params.get("q") ?? "");
    setCurrency(params.get("currency") ?? "EUR");

    const order = params.get("order");
    if (order === "newest_first") setSort("newest");
    else if (order === "price_low_to_high") setSort("price_asc");
    else if (order === "price_high_to_low") setSort("price_desc");
    else setSort("relevance");

    const max = params.get("price_to");
    const min = params.get("price_from");
    setPriceMin(min ? String(min) : "");
    setPriceMax(max ? String(max) : "");

    const byId = (arr: Array<{ id: number; title: string }>) => new Map(arr.map((o) => [o.id, o.title]));
    const brandMap = byId(facetBrands);
    const statusMap = byId(statusOptions.length ? statusOptions : facetStatuses);
    const colorMap = byId(facetColors);
    const materialMap = byId(facetMaterials);

    setCategoryId((catalogIds[0] ?? catalogIdsAlt[0]) ? String(catalogIds[0] ?? catalogIdsAlt[0]) : "");
    setBrandSelected(brandIds.map((id) => ({ id, title: brandMap.get(id) ?? `#${id}` })));
    setStatusSelected(statusIds.map((id) => ({ id, title: statusMap.get(id) ?? `#${id}` })));
    setColorSelected(colorIds.map((id) => ({ id, title: colorMap.get(id) ?? `#${id}` })));
    setMaterialSelected(materialIds.map((id) => ({ id, title: materialMap.get(id) ?? `#${id}` })));

    setSizeSelectedWomen(toOptions(sizeIds, SIZE_PRESETS.women_clothing.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedWomenShoes(toOptions(sizeIds, SIZE_PRESETS.women_shoes.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedBras(toOptions(sizeIds, SIZE_PRESETS.bras.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedWomenBelts(toOptions(sizeIds, SIZE_PRESETS.women_belts.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMen(toOptions(sizeIds, SIZE_PRESETS.men_clothing.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenShoes(toOptions(sizeIds, SIZE_PRESETS.men_shoes.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedRings(toOptions(sizeIds, SIZE_PRESETS.rings.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedAdultHats(toOptions(sizeIds, SIZE_PRESETS.adult_hats.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedAdultGloves(toOptions(sizeIds, SIZE_PRESETS.adult_gloves.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedWatches(toOptions(sizeIds, SIZE_PRESETS.watches.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenBelts(toOptions(sizeIds, SIZE_PRESETS.men_belts.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenSocks(toOptions(sizeIds, SIZE_PRESETS.men_socks.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenShirts(toOptions(sizeIds, SIZE_PRESETS.men_shirts.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenSuitJackets(toOptions(sizeIds, SIZE_PRESETS.men_suit_jackets.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));
    setSizeSelectedMenPants(toOptions(sizeIds, SIZE_PRESETS.men_pants.options.reduce((a, o) => ({ ...a, [o.id]: o.title }), {} as Record<number, string>)));

    setFiltersOpen(true);
  }

  async function saveEditingAlert() {
    if (!editingAlertId) return;
    const trimmed = q.trim();
    if (!trimmed) return;
    const min = priceMin.trim();
    const max = priceMax.trim();
    await api<Alert>(`/v1/alerts/${encodeURIComponent(editingAlertId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: {
          q: trimmed,
          perPage,
          sort: "newest" as const,
          currency: currency.trim() || "EUR",
          ...(categoryId ? { catalogIds: Number(categoryId) } : {}),
          ...(brandSelected.length ? { brandIds: brandSelected.map((b) => b.id) } : {}),
          ...(sizeSelectedWomen.length ? { sizeIds4: sizeSelectedWomen.map((s) => s.id) } : {}),
          ...(sizeSelectedMen.length ? { sizeIds14: sizeSelectedMen.map((s) => s.id) } : {}),
          ...(sizeSelectedWomenShoes.length ? { sizeIds7: sizeSelectedWomenShoes.map((s) => s.id) } : {}),
          ...(sizeSelectedBras.length ? { sizeIds53: sizeSelectedBras.map((s) => s.id) } : {}),
          ...(sizeSelectedWomenBelts.length ? { sizeIds64: sizeSelectedWomenBelts.map((s) => s.id) } : {}),
          ...(sizeSelectedMenShoes.length ? { sizeIds38: sizeSelectedMenShoes.map((s) => s.id) } : {}),
          ...(sizeSelectedRings.length ? { sizeIds52: sizeSelectedRings.map((s) => s.id) } : {}),
          ...(sizeSelectedAdultHats.length ? { sizeIds60: sizeSelectedAdultHats.map((s) => s.id) } : {}),
          ...(sizeSelectedAdultGloves.length ? { sizeIds61: sizeSelectedAdultGloves.map((s) => s.id) } : {}),
          ...(sizeSelectedWatches.length ? { sizeIds62: sizeSelectedWatches.map((s) => s.id) } : {}),
          ...(sizeSelectedMenBelts.length ? { sizeIds63: sizeSelectedMenBelts.map((s) => s.id) } : {}),
          ...(sizeSelectedMenSocks.length ? { sizeIds73: sizeSelectedMenSocks.map((s) => s.id) } : {}),
          ...(sizeSelectedMenShirts.length ? { sizeIds74: sizeSelectedMenShirts.map((s) => s.id) } : {}),
          ...(sizeSelectedMenSuitJackets.length ? { sizeIds75: sizeSelectedMenSuitJackets.map((s) => s.id) } : {}),
          ...(sizeSelectedMenPants.length ? { sizeIds77: sizeSelectedMenPants.map((s) => s.id) } : {}),
          ...(statusSelected.length ? { statusIds: statusSelected.map((s) => s.id) } : {}),
          ...(colorSelected.length ? { colorIds: colorSelected.map((c) => c.id) } : {}),
          ...(materialSelected.length ? { materialIds: materialSelected.map((m) => m.id) } : {}),
          ...(min ? { priceMin: Math.round(Number(min) * 100) } : {}),
          ...(max ? { priceMax: Math.round(Number(max) * 100) } : {})
        }
      })
    });
    await loadAlerts();
    setFiltersOpen(false);
    setEditingAlertId(null);
  }

  function showToast(payload: { title: string; url: string }) {
    setToast(payload);
    setLastUpdatedAt(Date.now());
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }

  function connectStream(url: URL) {
    esRef.current?.close();
    esRef.current = null;
    setStreamItems([]);
    setStreamError(null);

    const es = new EventSource(url.toString());
    esRef.current = es;

    es.addEventListener("item.new", (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as any;
        const item = parsed.payload as SearchItem;
        const sourceKey = (parsed.sourceKey ?? parsed.alertId ?? "") as string;
        if (liveModeRef.current === "monitors") {
          const armed = armedIdsRef.current;
          if (sourceKey && !armed.includes(sourceKey)) return;
        }
        setStreamItems((prev) => {
          const next = [item, ...prev.filter((p) => p.id !== item.id)];
          return next.slice(0, 250);
        });
        showToast({ title: `NEW: ${item.title}`, url: item.url });
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const n = new Notification(item.title, { tag: String(item.id) });
            n.onclick = () => {
              window.focus();
              window.open(item.url, "_blank", "noopener,noreferrer");
            };
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    });
    es.addEventListener("alert.error", (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as AlertEvent;
        setStreamError(parsed.payload?.message ?? "Alert error");
      } catch {
        setStreamError("Alert error");
      }
    });
    es.onerror = () => setStreamError("Stream disconnected. Retrying…");
  }

  function startLiveFromSavedAlert(alertId: string) {
    const url = new URL(`/v1/alerts/${encodeURIComponent(alertId)}/stream`, API_BASE_URL);
    url.searchParams.set("since", "0");
    connectStream(url);
  }

  function startLiveFromMonitors(alertIds?: string[]) {
    const url = new URL(`/v1/notifications/stream`, API_BASE_URL);
    url.searchParams.set("sourceType", "alert");
    const ids = (alertIds ?? []).filter(Boolean);
    if (ids.length) url.searchParams.set("sourceKeys", ids.join(","));
    connectStream(url);
  }

  function startLiveFromQuery() {
    const trimmed = q.trim();
    if (!trimmed) return;
    const url = new URL(`/v1/search/stream`, API_BASE_URL);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", String(perPage));
    url.searchParams.set("sort", "newest");
    url.searchParams.set("currency", currency.trim() || "EUR");
    if (categoryId) url.searchParams.set("catalogIds", categoryId);
    if (brandSelected.length) url.searchParams.set("brandIds", brandSelected.map((b) => b.id).join(","));
    if (sizeSelectedWomen.length) url.searchParams.set("sizeIds4", sizeSelectedWomen.map((s) => s.id).join(","));
    if (sizeSelectedMen.length) url.searchParams.set("sizeIds14", sizeSelectedMen.map((s) => s.id).join(","));
    if (sizeSelectedWomenShoes.length) url.searchParams.set("sizeIds7", sizeSelectedWomenShoes.map((s) => s.id).join(","));
    if (sizeSelectedBras.length) url.searchParams.set("sizeIds53", sizeSelectedBras.map((s) => s.id).join(","));
    if (sizeSelectedWomenBelts.length) url.searchParams.set("sizeIds64", sizeSelectedWomenBelts.map((s) => s.id).join(","));
    if (sizeSelectedMenShoes.length) url.searchParams.set("sizeIds38", sizeSelectedMenShoes.map((s) => s.id).join(","));
    if (sizeSelectedRings.length) url.searchParams.set("sizeIds52", sizeSelectedRings.map((s) => s.id).join(","));
    if (sizeSelectedAdultHats.length) url.searchParams.set("sizeIds60", sizeSelectedAdultHats.map((s) => s.id).join(","));
    if (sizeSelectedAdultGloves.length) url.searchParams.set("sizeIds61", sizeSelectedAdultGloves.map((s) => s.id).join(","));
    if (sizeSelectedWatches.length) url.searchParams.set("sizeIds62", sizeSelectedWatches.map((s) => s.id).join(","));
    if (sizeSelectedMenBelts.length) url.searchParams.set("sizeIds63", sizeSelectedMenBelts.map((s) => s.id).join(","));
    if (sizeSelectedMenSocks.length) url.searchParams.set("sizeIds73", sizeSelectedMenSocks.map((s) => s.id).join(","));
    if (sizeSelectedMenShirts.length) url.searchParams.set("sizeIds74", sizeSelectedMenShirts.map((s) => s.id).join(","));
    if (sizeSelectedMenSuitJackets.length) url.searchParams.set("sizeIds75", sizeSelectedMenSuitJackets.map((s) => s.id).join(","));
    if (sizeSelectedMenPants.length) url.searchParams.set("sizeIds77", sizeSelectedMenPants.map((s) => s.id).join(","));
    if (statusSelected.length) url.searchParams.set("statusIds", statusSelected.map((s) => s.id).join(","));
    if (colorSelected.length) url.searchParams.set("colorIds", colorSelected.map((c) => c.id).join(","));
    if (materialSelected.length) url.searchParams.set("materialIds", materialSelected.map((m) => m.id).join(","));
    const min = priceMin.trim();
    const max = priceMax.trim();
    if (min) url.searchParams.set("priceMin", String(Math.round(Number(min) * 100)));
    if (max) url.searchParams.set("priceMax", String(Math.round(Number(max) * 100)));
    connectStream(url);
  }

  async function loadItemDetails(itemId: number) {
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    try {
      const res = await api<ItemDetails>(`/v1/items/${encodeURIComponent(String(itemId))}`);
      setDetails(res);
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function runSearch(nextPage: number) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/v1/search", API_BASE_URL);
      url.searchParams.set("q", trimmed);
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("perPage", String(perPage));
      url.searchParams.set("fill", "1");
      url.searchParams.set("sort", sort);
      url.searchParams.set("currency", currency.trim() || "EUR");

      if (categoryId) url.searchParams.set("catalogIds", categoryId);

      const min = priceMin.trim();
      const max = priceMax.trim();
      if (min) url.searchParams.set("priceMin", String(Math.round(Number(min) * 100)));
      if (max) url.searchParams.set("priceMax", String(Math.round(Number(max) * 100)));

      if (brandSelected.length) url.searchParams.set("brandIds", brandSelected.map((b) => b.id).join(","));
      if (sizeSelectedWomen.length) url.searchParams.set("sizeIds4", sizeSelectedWomen.map((s) => s.id).join(","));
      if (sizeSelectedMen.length) url.searchParams.set("sizeIds14", sizeSelectedMen.map((s) => s.id).join(","));
      if (sizeSelectedWomenShoes.length) url.searchParams.set("sizeIds7", sizeSelectedWomenShoes.map((s) => s.id).join(","));
      if (sizeSelectedBras.length) url.searchParams.set("sizeIds53", sizeSelectedBras.map((s) => s.id).join(","));
      if (sizeSelectedWomenBelts.length) url.searchParams.set("sizeIds64", sizeSelectedWomenBelts.map((s) => s.id).join(","));
      if (sizeSelectedMenShoes.length) url.searchParams.set("sizeIds38", sizeSelectedMenShoes.map((s) => s.id).join(","));
      if (sizeSelectedRings.length) url.searchParams.set("sizeIds52", sizeSelectedRings.map((s) => s.id).join(","));
      if (sizeSelectedAdultHats.length) url.searchParams.set("sizeIds60", sizeSelectedAdultHats.map((s) => s.id).join(","));
      if (sizeSelectedAdultGloves.length) url.searchParams.set("sizeIds61", sizeSelectedAdultGloves.map((s) => s.id).join(","));
      if (sizeSelectedWatches.length) url.searchParams.set("sizeIds62", sizeSelectedWatches.map((s) => s.id).join(","));
      if (sizeSelectedMenBelts.length) url.searchParams.set("sizeIds63", sizeSelectedMenBelts.map((s) => s.id).join(","));
      if (sizeSelectedMenSocks.length) url.searchParams.set("sizeIds73", sizeSelectedMenSocks.map((s) => s.id).join(","));
      if (sizeSelectedMenShirts.length) url.searchParams.set("sizeIds74", sizeSelectedMenShirts.map((s) => s.id).join(","));
      if (sizeSelectedMenSuitJackets.length) url.searchParams.set("sizeIds75", sizeSelectedMenSuitJackets.map((s) => s.id).join(","));
      if (sizeSelectedMenPants.length) url.searchParams.set("sizeIds77", sizeSelectedMenPants.map((s) => s.id).join(","));
      if (statusSelected.length) url.searchParams.set("statusIds", statusSelected.map((s) => s.id).join(","));
      if (colorSelected.length) url.searchParams.set("colorIds", colorSelected.map((c) => c.id).join(","));
      if (materialSelected.length) url.searchParams.set("materialIds", materialSelected.map((m) => m.id).join(","));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as SearchResponse;
      setData(json);
      setPage(json.page);
      setActiveView("search");
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function createAlertFromQuery() {
    const trimmed = q.trim();
    if (!trimmed) return;
    setAlertsError(null);
    try {
      const min = priceMin.trim();
      const max = priceMax.trim();
      const created = await api<Alert>("/v1/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          // Persist full query context so alerts are actually filtered like the UI.
          query: {
            q: trimmed,
            perPage,
            sort: "newest" as const,
            currency: currency.trim() || "EUR",
            ...(categoryId ? { catalogIds: Number(categoryId) } : {}),
            ...(brandSelected.length ? { brandIds: brandSelected.map((b) => b.id) } : {}),
            ...(sizeSelectedWomen.length ? { sizeIds4: sizeSelectedWomen.map((s) => s.id) } : {}),
            ...(sizeSelectedMen.length ? { sizeIds14: sizeSelectedMen.map((s) => s.id) } : {}),
            ...(sizeSelectedWomenShoes.length ? { sizeIds7: sizeSelectedWomenShoes.map((s) => s.id) } : {}),
            ...(sizeSelectedBras.length ? { sizeIds53: sizeSelectedBras.map((s) => s.id) } : {}),
            ...(sizeSelectedWomenBelts.length ? { sizeIds64: sizeSelectedWomenBelts.map((s) => s.id) } : {}),
            ...(sizeSelectedMenShoes.length ? { sizeIds38: sizeSelectedMenShoes.map((s) => s.id) } : {}),
            ...(sizeSelectedRings.length ? { sizeIds52: sizeSelectedRings.map((s) => s.id) } : {}),
            ...(sizeSelectedAdultHats.length ? { sizeIds60: sizeSelectedAdultHats.map((s) => s.id) } : {}),
            ...(sizeSelectedAdultGloves.length ? { sizeIds61: sizeSelectedAdultGloves.map((s) => s.id) } : {}),
            ...(sizeSelectedWatches.length ? { sizeIds62: sizeSelectedWatches.map((s) => s.id) } : {}),
            ...(sizeSelectedMenBelts.length ? { sizeIds63: sizeSelectedMenBelts.map((s) => s.id) } : {}),
            ...(sizeSelectedMenSocks.length ? { sizeIds73: sizeSelectedMenSocks.map((s) => s.id) } : {}),
            ...(sizeSelectedMenShirts.length ? { sizeIds74: sizeSelectedMenShirts.map((s) => s.id) } : {}),
            ...(sizeSelectedMenSuitJackets.length ? { sizeIds75: sizeSelectedMenSuitJackets.map((s) => s.id) } : {}),
            ...(sizeSelectedMenPants.length ? { sizeIds77: sizeSelectedMenPants.map((s) => s.id) } : {}),
            ...(statusSelected.length ? { statusIds: statusSelected.map((s) => s.id) } : {}),
            ...(colorSelected.length ? { colorIds: colorSelected.map((c) => c.id) } : {}),
            ...(materialSelected.length ? { materialIds: materialSelected.map((m) => m.id) } : {}),
            ...(min ? { priceMin: Math.round(Number(min) * 100) } : {}),
            ...(max ? { priceMax: Math.round(Number(max) * 100) } : {})
          },
          pollIntervalSeconds: 60
        })
      });
      await loadAlerts();
      setArmedAlertIds((prev) => Array.from(new Set([...(prev ?? []), created.id])));
      setLiveMode("monitors");
      setActiveView("live");
    } catch (e) {
      setAlertsError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function deleteAlert(id: string) {
    setAlertsError(null);
    try {
      await api<{ ok: true }>(`/v1/alerts/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (selectedAlertId === id) setSelectedAlertId(null);
      setStreamItems([]);
      await loadAlerts();
    } catch (e) {
      setAlertsError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  useEffect(() => {
    void loadAlerts();
  }, []);

  useEffect(() => {
    if (liveMode === "saved") {
      if (!selectedAlertId) return;
      startLiveFromSavedAlert(selectedAlertId);
      return () => {
        esRef.current?.close();
        esRef.current = null;
      };
    }
    if (liveMode === "monitors") {
      startLiveFromMonitors(armedAlertIds);
      return () => {
        esRef.current?.close();
        esRef.current = null;
      };
    }
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [selectedAlertId, liveMode, armedAlertIds]);

  useEffect(() => {
    try {
      localStorage.setItem("armedAlertIds", JSON.stringify(armedAlertIds));
    } catch {
      // ignore
    }
  }, [armedAlertIds]);

  useEffect(() => {
    liveModeRef.current = liveMode;
  }, [liveMode]);

  useEffect(() => {
    armedIdsRef.current = armedAlertIds;
  }, [armedAlertIds]);

  useEffect(() => {
    (async () => {
      try {
        // Categories are often missing from /catalog/filters; use faceted categories endpoint.
        const cats = await api<{ categories: CatalogCategory[] }>("/v1/catalog/categories?currency=EUR");
        setCategories(cats.categories ?? []);

        // Also load /catalog/filters once to potentially hydrate non-lazy option lists (statuses).
        const res = await api<CatalogFiltersResponse>("/v1/catalog/filters?currency=EUR&order=newest_first");
        if (Array.isArray(res.statuses) && res.statuses.length) setStatusOptions(res.statuses);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load facets (for "deduced" options) for current search text.
  useEffect(() => {
    const searchText = q.trim();
    if (!searchText) {
      setFacetBrands([]);
      setFacetSizes([]);
      setFacetStatuses([]);
      return;
    }
    void (async () => {
      try {
        const base = new URLSearchParams();
        base.set("currency", currency.trim() || "EUR");
        base.set("searchText", searchText);
        if (categoryId) base.set("catalogIds", categoryId);

        // Important: do NOT include the facet's own ids in its request (or you'll only get selected values).
        const forBrands = new URLSearchParams(base);
        if (statusSelected.length) forBrands.set("statusIds", statusSelected.map((s) => s.id).join(","));
        if (sizeSelectedWomen.length) forBrands.set("sizeIds4", sizeSelectedWomen.map((s) => s.id).join(","));
        if (sizeSelectedMen.length) forBrands.set("sizeIds14", sizeSelectedMen.map((s) => s.id).join(","));
        if (colorSelected.length) forBrands.set("colorIds", colorSelected.map((c) => c.id).join(","));
        if (materialSelected.length) forBrands.set("materialIds", materialSelected.map((m) => m.id).join(","));

        const forStatuses = new URLSearchParams(base);
        if (brandSelected.length) forStatuses.set("brandIds", brandSelected.map((b) => b.id).join(","));
        if (sizeSelectedWomen.length) forStatuses.set("sizeIds4", sizeSelectedWomen.map((s) => s.id).join(","));
        if (sizeSelectedMen.length) forStatuses.set("sizeIds14", sizeSelectedMen.map((s) => s.id).join(","));
        if (colorSelected.length) forStatuses.set("colorIds", colorSelected.map((c) => c.id).join(","));
        if (materialSelected.length) forStatuses.set("materialIds", materialSelected.map((m) => m.id).join(","));

        // Sizes: we still fetch without category, but we'll filter out "catalog-like" options in the UI.
        const forSizes = new URLSearchParams();
        forSizes.set("currency", currency.trim() || "EUR");
        forSizes.set("order", "newest_first");
        forSizes.set("q", searchText);
        if (categoryId) forSizes.set("catalogIds", categoryId);
        if (brandSelected.length) forSizes.set("brandIds", brandSelected.map((b) => b.id).join(","));
        if (statusSelected.length) forSizes.set("statusIds", statusSelected.map((s) => s.id).join(","));
        if (colorSelected.length) forSizes.set("colorIds", colorSelected.map((c) => c.id).join(","));
        if (materialSelected.length) forSizes.set("materialIds", materialSelected.map((m) => m.id).join(","));

        const [brands, statuses, filters] = await Promise.all([
          api<CatalogFacetResponse>(`/v1/catalog/facets?filterCode=brand&${forBrands.toString()}`),
          api<CatalogFacetResponse>(`/v1/catalog/facets?filterCode=status&${forStatuses.toString()}`),
          api<CatalogFiltersResponse>(`/v1/catalog/filters?${forSizes.toString()}`)
        ]);
        setFacetBrands(brands.options ?? []);
        // Keep upstream-provided sizes (may depend on the selected category / query).
        setFacetSizes(filters.sizes ?? []);
        setFacetStatuses(statuses.options ?? []);
        // Prefer facets statuses (ordered + descriptions) over other sources.
        if (Array.isArray(statuses.options) && statuses.options.length) {
          setStatusOptions(statuses.options as any);
        }
      } catch {
        // ignore
      }
    })();
  }, [
    q,
    currency,
    categoryId,
    brandSelected,
    statusSelected,
    sizeSelectedWomen,
    sizeSelectedWomenShoes,
    sizeSelectedBras,
    sizeSelectedWomenBelts,
    sizeSelectedMen,
    sizeSelectedMenShoes,
    sizeSelectedRings,
    sizeSelectedAdultHats,
    sizeSelectedAdultGloves,
    sizeSelectedWatches,
    sizeSelectedMenBelts,
    sizeSelectedMenSocks,
    sizeSelectedMenShirts,
    sizeSelectedMenSuitJackets,
    sizeSelectedMenPants,
    colorSelected,
    materialSelected
  ]);

  // Load more facets for color/material when query is set
  useEffect(() => {
    const searchText = q.trim();
    if (!searchText) {
      setFacetColors([]);
      setFacetMaterials([]);
      return;
    }
    void (async () => {
      try {
        const common = new URLSearchParams();
        common.set("currency", currency.trim() || "EUR");
        common.set("searchText", searchText);
        if (categoryId) common.set("catalogIds", categoryId);
        if (brandSelected.length) common.set("brandIds", brandSelected.map((b) => b.id).join(","));
        if (statusSelected.length) common.set("statusIds", statusSelected.map((s) => s.id).join(","));
        if (sizeSelectedWomen.length) common.set("sizeIds4", sizeSelectedWomen.map((s) => s.id).join(","));
        if (sizeSelectedMen.length) common.set("sizeIds14", sizeSelectedMen.map((s) => s.id).join(","));
        if (sizeSelectedWomenShoes.length) common.set("sizeIds7", sizeSelectedWomenShoes.map((s) => s.id).join(","));
        if (sizeSelectedBras.length) common.set("sizeIds53", sizeSelectedBras.map((s) => s.id).join(","));
        if (sizeSelectedWomenBelts.length) common.set("sizeIds64", sizeSelectedWomenBelts.map((s) => s.id).join(","));
        if (sizeSelectedMenShoes.length) common.set("sizeIds38", sizeSelectedMenShoes.map((s) => s.id).join(","));
        if (sizeSelectedRings.length) common.set("sizeIds52", sizeSelectedRings.map((s) => s.id).join(","));
        if (sizeSelectedAdultHats.length) common.set("sizeIds60", sizeSelectedAdultHats.map((s) => s.id).join(","));
        if (sizeSelectedAdultGloves.length) common.set("sizeIds61", sizeSelectedAdultGloves.map((s) => s.id).join(","));
        if (sizeSelectedWatches.length) common.set("sizeIds62", sizeSelectedWatches.map((s) => s.id).join(","));
        if (sizeSelectedMenBelts.length) common.set("sizeIds63", sizeSelectedMenBelts.map((s) => s.id).join(","));
        if (sizeSelectedMenSocks.length) common.set("sizeIds73", sizeSelectedMenSocks.map((s) => s.id).join(","));
        if (sizeSelectedMenShirts.length) common.set("sizeIds74", sizeSelectedMenShirts.map((s) => s.id).join(","));
        if (sizeSelectedMenSuitJackets.length) common.set("sizeIds75", sizeSelectedMenSuitJackets.map((s) => s.id).join(","));
        if (sizeSelectedMenPants.length) common.set("sizeIds77", sizeSelectedMenPants.map((s) => s.id).join(","));

        const [colors, materials] = await Promise.all([
          api<CatalogFacetResponse>(`/v1/catalog/facets?filterCode=color&${common.toString()}`),
          api<CatalogFacetResponse>(`/v1/catalog/facets?filterCode=material&${common.toString()}`)
        ]);
        setFacetColors(colors.options ?? []);
        setFacetMaterials(materials.options ?? []);
      } catch {
        // ignore
      }
    })();
  }, [
    q,
    currency,
    categoryId,
    brandSelected,
    statusSelected,
    sizeSelectedWomen,
    sizeSelectedMen,
    sizeSelectedWomenShoes,
    sizeSelectedBras,
    sizeSelectedWomenBelts,
    sizeSelectedMenShoes,
    sizeSelectedRings,
    sizeSelectedAdultHats,
    sizeSelectedAdultGloves,
    sizeSelectedWatches,
    sizeSelectedMenBelts,
    sizeSelectedMenSocks,
    sizeSelectedMenShirts,
    sizeSelectedMenSuitJackets,
    sizeSelectedMenPants
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if (e.key === "Escape") {
        setSelectedItem(null);
      }
      if (!isTyping && e.key === "g") setActiveView("live");
      if (!isTyping && e.key === "s") setActiveView("search");
      if (!isTyping && e.key === "b") setSidebarOpen((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    void loadItemDetails(selectedItem.id);
  }, [selectedItem?.id]);

  const previewItem = hovered ?? selectedItem;

  const refreshNow = () => {
    if (activeView === "search") {
      void runSearch(page);
      return;
    }
    // live view
    if (liveMode === "query") {
      startLiveFromQuery();
      return;
    }
    if (liveMode === "monitors") {
      startLiveFromMonitors(armedAlertIds);
      return;
    }
    if (selectedAlertId) startLiveFromSavedAlert(selectedAlertId);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {toast && (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-24px))]">
          <a
            href={toast.url}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto block rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-lg backdrop-blur transition hover:bg-white"
            title="Open on Vinted"
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Icon name="bolt" className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{toast.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Live update received
                </div>
              </div>
              <div className="ml-auto text-[10px] font-semibold text-slate-400">
                now
              </div>
            </div>
          </a>
        </div>
      )}

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        alerts={alerts}
        alertsLoading={alertsLoading}
        alertsError={alertsError}
        selectedAlertId={selectedAlertId}
        setSelectedAlertId={(id) => {
          setLiveMode("saved");
          setSelectedAlertId(id);
          setActiveView("live");
        }}
        liveMode={liveMode}
        selectMonitors={() => {
          setLiveMode("monitors");
          setSelectedAlertId(null);
          setActiveView("live");
        }}
        armedAlertIds={armedAlertIds}
        setArmedAlertIds={setArmedAlertIds}
        streamError={streamError}
        deleteAlert={deleteAlert}
        onEditAlert={(id) => {
          const a = alerts.find((x) => x.id === id);
          if (!a) return;
          setEditingAlertId(id);
          loadFiltersFromAlert(a);
          setFiltersOpen(true);
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden w-full relative">
      <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          inspectorOpen={inspectorOpen}
          setInspectorOpen={setInspectorOpen}
          q={q}
          setQ={setQ}
          runSearch={runSearch}
          loading={loading}
          createAlertFromQuery={createAlertFromQuery}
          startLiveFromQuery={() => {
            setLiveMode("query");
            setActiveView("live");
            startLiveFromQuery();
          }}
          liveMode={liveMode}
          setLiveMode={setLiveMode}
          refreshNow={refreshNow}
          lastUpdatedAt={lastUpdatedAt}
          selectedAlertId={selectedAlertId}
          armedCount={armedAlertIds.length}
          openArmedFeed={() => {
            setLiveMode("monitors");
            setSelectedAlertId(null);
            setActiveView("live");
            startLiveFromMonitors(armedAlertIds);
          }}
          streamItemsLength={streamItems.length}
          activeView={activeView}
          setActiveView={setActiveView}
          activeFiltersLabel={activeFiltersLabel}
          layout={layout}
          setLayout={setLayout}
          data={data}
          page={page}
          perPage={perPage}
          setPerPage={setPerPage}
          canNext={canNext}
          openFilters={() => setFiltersOpen(true)}
          importVintedUrl={importFiltersFromVintedUrl}
        />

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-[14px] font-medium text-rose-700 shadow-sm backdrop-blur">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-3 max-w-4xl mx-auto">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : !items.length ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/40 p-12 text-center backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4 shadow-inner">
                  <Icon name={activeView === "live" ? "radar" : "search"} className="text-[32px]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {activeView === "live" ? "Listening for deals..." : "No results found"}
                </h3>
                <p className="text-slate-500 max-w-sm leading-relaxed">
                  {activeView === "live"
                    ? "Your feed is empty. Select an alert from the sidebar or arm a new monitor to start receiving live items."
                    : "Try adjusting your filters or search terms. Don't forget you can arm a monitor to get notified when new items appear!"}
                </p>
              </div>
            ) : (
              <div
                className={
                  layout === "cards"
                    ? "grid grid-cols-1 gap-5 auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                    : "grid gap-3 max-w-5xl mx-auto"
                }
              >
                {items.map((it, index) => (
                  <ItemCard
                    key={`${it.id}-${index}`}
                    item={it}
                    layout={layout}
                    hot={activeView === "live"}
                    selected={selectedItem?.id === it.id}
                    onHover={setHovered}
                    onClick={setSelectedItem}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {inspectorOpen && (
        <InspectorDrawer
          item={previewItem}
          selectedItem={selectedItem}
          details={details}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          onClose={() => setSelectedItem(null)}
          activeView={activeView}
        />
      )}

      <FiltersModal
        open={filtersOpen}
        onClose={() => {
          setFiltersOpen(false);
          setEditingAlertId(null);
        }}
        primaryAction={
          editingAlertId
            ? { label: "Save to alert", onClick: () => void saveEditingAlert(), disabled: !q.trim() }
            : undefined
        }
        sort={sort}
        setSort={setSort}
        currency={currency}
        setCurrency={setCurrency}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        categoryOptions={categoryOptions}
        facetBrands={facetBrands}
        facetSizes={facetSizes}
        facetColors={facetColors}
        facetMaterials={facetMaterials}
        brandSelected={brandSelected}
        setBrandSelected={setBrandSelected as any}
        sizeSelectedWomen={sizeSelectedWomen}
        setSizeSelectedWomen={setSizeSelectedWomen as any}
        sizeSelectedWomenShoes={sizeSelectedWomenShoes}
        setSizeSelectedWomenShoes={setSizeSelectedWomenShoes as any}
        sizeSelectedBras={sizeSelectedBras}
        setSizeSelectedBras={setSizeSelectedBras as any}
        sizeSelectedWomenBelts={sizeSelectedWomenBelts}
        setSizeSelectedWomenBelts={setSizeSelectedWomenBelts as any}
        sizeSelectedMen={sizeSelectedMen}
        setSizeSelectedMen={setSizeSelectedMen as any}
        sizeSelectedMenShoes={sizeSelectedMenShoes}
        setSizeSelectedMenShoes={setSizeSelectedMenShoes as any}
        sizeSelectedRings={sizeSelectedRings}
        setSizeSelectedRings={setSizeSelectedRings as any}
        sizeSelectedAdultHats={sizeSelectedAdultHats}
        setSizeSelectedAdultHats={setSizeSelectedAdultHats as any}
        sizeSelectedAdultGloves={sizeSelectedAdultGloves}
        setSizeSelectedAdultGloves={setSizeSelectedAdultGloves as any}
        sizeSelectedWatches={sizeSelectedWatches}
        setSizeSelectedWatches={setSizeSelectedWatches as any}
        sizeSelectedMenBelts={sizeSelectedMenBelts}
        setSizeSelectedMenBelts={setSizeSelectedMenBelts as any}
        sizeSelectedMenSocks={sizeSelectedMenSocks}
        setSizeSelectedMenSocks={setSizeSelectedMenSocks as any}
        sizeSelectedMenShirts={sizeSelectedMenShirts}
        setSizeSelectedMenShirts={setSizeSelectedMenShirts as any}
        sizeSelectedMenSuitJackets={sizeSelectedMenSuitJackets}
        setSizeSelectedMenSuitJackets={setSizeSelectedMenSuitJackets as any}
        sizeSelectedMenPants={sizeSelectedMenPants}
        setSizeSelectedMenPants={setSizeSelectedMenPants as any}
        statusOptions={statusOptions}
        statusSelected={statusSelected}
        setStatusSelected={setStatusSelected as any}
        colorSelected={colorSelected}
        setColorSelected={setColorSelected as any}
        materialSelected={materialSelected}
        setMaterialSelected={setMaterialSelected as any}
      />
    </div>
  );
}
