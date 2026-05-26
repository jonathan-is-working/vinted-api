import { type VintedClient } from "../upstream/vinted.client.js";
import { type Env } from "../config/env.js";
import { type CatalogCategory, type CatalogFiltersResponse, type CatalogOption } from "./catalog.types.js";

function tryNormalizeCategories(raw: any): CatalogCategory[] {
  // Vinted response structure is not documented and may change.
  // We try common shapes and fall back to an empty list.
  const candidates = [
    raw?.catalogs,
    raw?.catalogs?.catalogs,
    raw?.catalogs_tree,
    raw?.catalogsTree,
    raw?.filters?.catalogs,
    raw?.filters?.catalogs_tree
  ];

  const arr = candidates.find((c) => Array.isArray(c));
  if (!Array.isArray(arr)) return [];

  const out: CatalogCategory[] = [];
  const visit = (node: any, parentId: number | null) => {
    const id = typeof node?.id === "number" ? node.id : Number(node?.id);
    const title =
      typeof node?.title === "string"
        ? node.title
        : typeof node?.name === "string"
          ? node.name
          : typeof node?.label === "string"
            ? node.label
            : null;

    if (Number.isFinite(id) && id > 0 && title) {
      out.push({ id, title, parentId });
    }

    const children =
      node?.children ??
      node?.catalogs ??
      node?.subcatalogs ??
      node?.sub_catalogs ??
      node?.subCatalogs;
    if (Array.isArray(children)) {
      for (const c of children) visit(c, Number.isFinite(id) && id > 0 ? id : parentId);
    }
  };

  for (const node of arr) visit(node, null);
  // de-dupe by id
  const map = new Map<number, CatalogCategory>();
  for (const c of out) map.set(c.id, c);
  return [...map.values()];
}

function tryNormalizeOptions(
  raw: any,
  keys: string[]
): CatalogOption[] {
  for (const key of keys) {
    const node = raw?.[key] ?? raw?.filters?.[key];
    const arr = Array.isArray(node) ? node : Array.isArray(node?.items) ? node.items : null;
    if (!Array.isArray(arr)) continue;

    const out: CatalogOption[] = [];
    for (const it of arr) {
      const id = typeof it?.id === "number" ? it.id : Number(it?.id);
      const title =
        typeof it?.title === "string"
          ? it.title
          : typeof it?.name === "string"
            ? it.name
            : typeof it?.label === "string"
              ? it.label
              : typeof it?.value === "string"
                ? it.value
                : null;
      if (Number.isFinite(id) && id > 0 && title) out.push({ id, title });
    }

    // de-dupe + sort
    const map = new Map<number, CatalogOption>();
    for (const o of out) map.set(o.id, o);
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }
  return [];
}

function tryNormalizeFilterDefinitions(raw: any): Array<{
  code: string;
  title: string;
  displayType: string | null;
  selectionType: string | null;
  isLazy: boolean;
}> {
  const arr = raw?.filters;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((f: any) => ({
      code: typeof f?.code === "string" ? f.code : "",
      title: typeof f?.title === "string" ? f.title : "",
      displayType: typeof f?.display_type === "string" ? f.display_type : null,
      selectionType: typeof f?.selection_type === "string" ? f.selection_type : null,
      isLazy: Boolean(f?.is_lazy)
    }))
    .filter((f) => f.code && f.title)
    .sort((a, b) => a.code.localeCompare(b.code));
}

function tryNormalizeOptionsFromSearch(raw: any): CatalogOption[] {
  const candidates = [
    raw?.options,
    raw?.items,
    raw?.brands,
    raw?.data,
    raw?.result,
    raw?.results
  ];
  const arr = candidates.find((c) => Array.isArray(c));
  if (!Array.isArray(arr)) return [];

  const out: CatalogOption[] = [];
  for (const it of arr) {
    const id = typeof it?.id === "number" ? it.id : Number(it?.id);
    const title =
      typeof it?.title === "string"
        ? it.title
        : typeof it?.name === "string"
          ? it.name
          : typeof it?.label === "string"
            ? it.label
            : typeof it?.value === "string"
              ? it.value
              : null;
    if (Number.isFinite(id) && id > 0 && title) {
      const count =
        typeof it?.items_count === "number"
          ? it.items_count
          : typeof it?.count === "number"
            ? it.count
            : undefined;
      const description = typeof it?.description === "string" ? it.description : undefined;
      out.push({
        id,
        title,
        ...(typeof count === "number" && Number.isFinite(count) ? { count } : {}),
        ...(description ? { description } : {})
      });
    }
  }
  const map = new Map<number, CatalogOption>();
  // Preserve upstream order by default (important for status quality ordering).
  for (const o of out) {
    if (!map.has(o.id)) map.set(o.id, o);
  }
  return [...map.values()];
}

export class CatalogService {
  private categoriesCache: { at: number; categories: CatalogCategory[]; raw: unknown } | null = null;
  private categoriesBlockedUntil = 0;
  private categoriesInFlight: Promise<{ categories: CatalogCategory[]; raw: unknown }> | null = null;

  constructor(
    private readonly vinted: VintedClient,
    private readonly env: Env
  ) {}

  async getFilters(input: {
    q?: string;
    currency: string;
    order: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<CatalogFiltersResponse> {
    const raw = await this.vinted.getCatalogFilters({
      searchText: input.q ?? "",
      currency: input.currency,
      order: input.order,
      catalogIds: input.catalogIds,
      sizeIds: input.sizeIds,
      brandIds: input.brandIds,
      statusIds: input.statusIds,
      colorIds: input.colorIds,
      materialIds: input.materialIds
    });

    const categories = tryNormalizeCategories(raw);
    const brands = tryNormalizeOptions(raw, ["brands", "brand", "brand_filters", "brandFilters"]);
    const sizes = tryNormalizeOptions(raw, ["sizes", "size", "size_filters", "sizeFilters"]);
    const statuses = tryNormalizeOptions(raw, ["statuses", "status", "status_filters", "statusFilters", "conditions"]);
    const colors = tryNormalizeOptions(raw, ["colors", "color", "color_filters", "colorFilters"]);
    const materials = tryNormalizeOptions(raw, ["materials", "material", "material_filters", "materialFilters"]);
    const filterDefinitions = tryNormalizeFilterDefinitions(raw);

    return { categories, brands, sizes, statuses, colors, materials, filterDefinitions, raw };
  }

  async searchOptions(input: {
    code: "brand" | "size" | "status" | "color" | "material";
    q: string;
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<{ options: CatalogOption[]; raw: unknown }> {
    // Some filters are marked as lazy and require the /filters/facets endpoint (ex: status).
    // When q is empty, prefer facets for deterministic option lists.
    if (input.code === "status" && !input.q.trim()) {
      const raw = await this.vinted.getFilterFacets({
        filterCode: "status",
        searchText: "",
        currency: input.currency,
        catalogIds: input.catalogIds,
        sizeIds: input.sizeIds,
        brandIds: input.brandIds,
        statusIds: input.statusIds,
        colorIds: input.colorIds,
        materialIds: input.materialIds
      });
      const options = tryNormalizeOptionsFromSearch(raw);
      return { options, raw };
    }

    const raw = await this.vinted.searchFilterOptions({
      filterSearchCode: input.code,
      searchText: input.q,
      currency: input.currency,
      catalogIds: input.catalogIds,
      sizeIds: input.sizeIds,
      brandIds: input.brandIds,
      statusIds: input.statusIds,
      colorIds: input.colorIds,
      materialIds: input.materialIds
    });

    const options = tryNormalizeOptionsFromSearch(raw);
    return { options, raw };
  }

  async getFilterFacets(input: {
    filterCode: "brand" | "size" | "status" | "color" | "material";
    searchText: string;
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<{ filterCode: string; options: CatalogOption[]; raw: unknown }> {
    const raw = await this.vinted.getFilterFacets({
      filterCode: input.filterCode,
      searchText: input.searchText,
      currency: input.currency,
      catalogIds: input.catalogIds,
      sizeIds: input.sizeIds,
      brandIds: input.brandIds,
      statusIds: input.statusIds,
      colorIds: input.colorIds,
      materialIds: input.materialIds
    });

    const options = tryNormalizeOptionsFromSearch(raw);
    return { filterCode: input.filterCode, options, raw };
  }

  async getFacetedCategories(input: {
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<{ categories: CatalogCategory[]; raw: unknown }> {
    if (this.categoriesInFlight) return this.categoriesInFlight;

    const run = async (): Promise<{ categories: CatalogCategory[]; raw: unknown }> => {
      const now = Date.now();
      if (now < this.categoriesBlockedUntil) {
        if (this.categoriesCache) return { categories: this.categoriesCache.categories, raw: this.categoriesCache.raw };
        return { categories: [], raw: { degraded: true, reason: "upstream_temporarily_blocked" } };
      }

      try {
        const raw = await this.vinted.getFacetedCategories({
          currency: input.currency,
          catalogIds: input.catalogIds,
          sizeIds: input.sizeIds,
          brandIds: input.brandIds,
          statusIds: input.statusIds,
          colorIds: input.colorIds,
          materialIds: input.materialIds
        });

        const categories = tryNormalizeCategories(raw);
        this.categoriesCache = { at: now, categories, raw };
        return { categories, raw };
      } catch (err) {
        const upstreamStatus =
          err && typeof err === "object" && "upstreamStatus" in err
            ? (err as any).upstreamStatus
            : undefined;

        if (upstreamStatus === 401 || upstreamStatus === 403) {
          this.categoriesBlockedUntil = now + 5 * 60_000;
          if (this.categoriesCache) return { categories: this.categoriesCache.categories, raw: this.categoriesCache.raw };
          return { categories: [], raw: { degraded: true, reason: "cloudflare_blocked" } };
        }

        throw err;
      }
    };

    this.categoriesInFlight = run().finally(() => {
      this.categoriesInFlight = null;
    });
    return this.categoriesInFlight;
  }
}
