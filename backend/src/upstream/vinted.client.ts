import axios, { type AxiosInstance } from "axios";
import { type Env } from "../config/env.js";
import { type VintedSessionManager } from "../session/session.manager.js";
import { RateLimiter } from "./rate_limiter.js";
import {
  VintedCatalogItemsResponseSchema,
  VintedCatalogFiltersResponseSchema,
  VintedFilterSearchResponseSchema,
  VintedBrandResponseSchema,
  VintedFacetedCategoriesResponseSchema,
  VintedFilterFacetsResponseSchema,
  type VintedCatalogItemsResponse,
  type VintedCatalogFiltersResponse,
  type VintedFilterSearchResponse,
  type VintedBrandResponse,
  type VintedFacetedCategoriesResponse,
  type VintedFilterFacetsResponse
} from "./vinted.schemas.js";

export type VintedSearchParams = {
  searchText: string;
  page: number;
  perPage: number;
  order: string;
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
  catalogIds?: number[];
  brandIds?: number[];
  sizeIds?: number[];
  // Grouped sizes as used by Vinted web UI filters.
  sizeIds4?: number[];
  sizeIds14?: number[];
  sizeIds7?: number[];
  sizeIds53?: number[];
  sizeIds64?: number[];
  sizeIds38?: number[];
  sizeIds52?: number[];
  sizeIds60?: number[];
  sizeIds61?: number[];
  sizeIds62?: number[];
  sizeIds63?: number[];
  sizeIds73?: number[];
  sizeIds74?: number[];
  sizeIds75?: number[];
  sizeIds77?: number[];
  statusIds?: number[];
  colorIds?: number[];
  materialIds?: number[];
};

export class VintedClient {
  private readonly http: AxiosInstance;
  private readonly limiter: RateLimiter;

  constructor(
    private readonly env: Env,
    private readonly sessions: VintedSessionManager
  ) {
    this.http = axios.create({
      baseURL: "https://www.vinted.fr",
      timeout: 10_000,
      headers: {
        accept: "application/json",
        locale: env.VINTED_LOCALE
      }
    });

    this.limiter = new RateLimiter({
      maxConcurrent: env.VINTED_MAX_CONCURRENCY,
      minSpacingMs: env.VINTED_MIN_SPACING_MS,
      maxQueue: 50
    });
  }

  private async getSessionHeaders(): Promise<Record<string, string>> {
    const session = await this.sessions.getSession();
    return session.headers;
  }

  private isUnauthorized(status: number): boolean {
    return status === 401 || status === 403;
  }

  private async getWithBackoff(
    path: string,
    headers: Record<string, string>,
    opts?: { responseType?: "json" | "text" }
  ) {
    const attempt = async () =>
      this.limiter.run(() =>
        this.http.get(path, {
          headers,
          responseType: opts?.responseType,
          validateStatus: () => true
        })
      );

    let res = await attempt();

    // Handle rate limiting: respect Retry-After when present, otherwise cooldown.
    if (res.status === 429) {
      const retryAfter = res.headers?.["retry-after"];
      const parsed = typeof retryAfter === "string" ? Number(retryAfter) : NaN;
      const ms =
        Number.isFinite(parsed) && parsed > 0
          ? Math.min(10 * 60_000, Math.floor(parsed * 1000))
          : this.env.VINTED_COOLDOWN_ON_429_MS;
      this.limiter.setCooldown(ms);

      // Don't immediately hammer again: only retry once and only if server provided Retry-After.
      if (Number.isFinite(parsed) && parsed > 0) {
        res = await attempt();
      }
    }

    return res;
  }

  private async getJsonWithRetry<T>(path: string, opts?: { responseType?: "json" | "text" }): Promise<{ res: any; data: T }> {
    const make = async () => this.getWithBackoff(path, await this.getSessionHeaders(), opts);
    let res = await make();
    if (this.isUnauthorized(res.status)) {
      await this.sessions.getSession({ forceRefresh: true, reason: "upstream_unauthorized" });
      res = await make();
    }
    return { res, data: res.data as T };
  }

  async searchCatalogItems(
    params: VintedSearchParams
  ): Promise<VintedCatalogItemsResponse> {
    const makeRequest = async () => {
      const qp = new URLSearchParams();
      qp.set("search_text", params.searchText);
      qp.set("page", String(params.page));
      qp.set("per_page", String(params.perPage));
      qp.set("order", params.order);
      if (typeof params.priceFrom === "number") qp.set("price_from", String(params.priceFrom));
      if (typeof params.priceTo === "number") qp.set("price_to", String(params.priceTo));
      if (params.currency) qp.set("currency", params.currency);
      if (params.catalogIds?.length) qp.set("catalog_ids", params.catalogIds.join(","));
      if (params.brandIds?.length) qp.set("brand_ids", params.brandIds.join(","));
      if (params.sizeIds?.length) qp.set("size_ids", params.sizeIds.join(","));
      if (params.statusIds?.length) qp.set("status_ids", params.statusIds.join(","));
      if (params.colorIds?.length) qp.set("color_ids", params.colorIds.join(","));
      if (params.materialIds?.length) qp.set("material_ids", params.materialIds.join(","));

      // Grouped size filters (e.g. size_ids_4[]=2&size_ids_14[]=206)
      if (params.sizeIds7?.length) {
        for (const id of params.sizeIds7) qp.append("size_ids_7[]", String(id));
      }
      if (params.sizeIds4?.length) {
        for (const id of params.sizeIds4) qp.append("size_ids_4[]", String(id));
      }
      if (params.sizeIds14?.length) {
        for (const id of params.sizeIds14) qp.append("size_ids_14[]", String(id));
      }
      if (params.sizeIds53?.length) {
        for (const id of params.sizeIds53) qp.append("size_ids_53[]", String(id));
      }
      if (params.sizeIds64?.length) {
        for (const id of params.sizeIds64) qp.append("size_ids_64[]", String(id));
      }
      if (params.sizeIds38?.length) {
        for (const id of params.sizeIds38) qp.append("size_ids_38[]", String(id));
      }
      if (params.sizeIds52?.length) {
        for (const id of params.sizeIds52) qp.append("size_ids_52[]", String(id));
      }
      if (params.sizeIds60?.length) {
        for (const id of params.sizeIds60) qp.append("size_ids_60[]", String(id));
      }
      if (params.sizeIds61?.length) {
        for (const id of params.sizeIds61) qp.append("size_ids_61[]", String(id));
      }
      if (params.sizeIds62?.length) {
        for (const id of params.sizeIds62) qp.append("size_ids_62[]", String(id));
      }
      if (params.sizeIds63?.length) {
        for (const id of params.sizeIds63) qp.append("size_ids_63[]", String(id));
      }
      if (params.sizeIds73?.length) {
        for (const id of params.sizeIds73) qp.append("size_ids_73[]", String(id));
      }
      if (params.sizeIds74?.length) {
        for (const id of params.sizeIds74) qp.append("size_ids_74[]", String(id));
      }
      if (params.sizeIds75?.length) {
        for (const id of params.sizeIds75) qp.append("size_ids_75[]", String(id));
      }
      if (params.sizeIds77?.length) {
        for (const id of params.sizeIds77) qp.append("size_ids_77[]", String(id));
      }

      const path = `/api/v2/catalog/items?${qp.toString()}`;
      const headers = await this.getSessionHeaders();
      return this.getWithBackoff(path, headers);
    };

    let res = await makeRequest();

    if (this.isUnauthorized(res.status)) {
      // Session likely expired/blocked. Force refresh and retry once.
      await this.sessions.getSession({ forceRefresh: true, reason: "upstream_unauthorized" });
      res = await makeRequest();
    }

    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = res.data;
      throw err;
    }

    return VintedCatalogItemsResponseSchema.parse(res.data);
  }

  async getCatalogFilters(params: {
    searchText?: string;
    currency: string;
    order: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<VintedCatalogFiltersResponse> {
    const time = Math.floor(Date.now() / 1000);
    const qp = new URLSearchParams();
    qp.set("search_text", params.searchText ?? "");
    qp.set("catalog_ids", params.catalogIds?.length ? params.catalogIds.join(",") : "");
    qp.set("currency", params.currency);
    qp.set("order", params.order);
    qp.set("time", String(time));
    qp.set("size_ids", params.sizeIds?.length ? params.sizeIds.join(",") : "");
    qp.set("brand_ids", params.brandIds?.length ? params.brandIds.join(",") : "");
    qp.set("status_ids", params.statusIds?.length ? params.statusIds.join(",") : "");
    qp.set("color_ids", params.colorIds?.length ? params.colorIds.join(",") : "");
    qp.set("material_ids", params.materialIds?.length ? params.materialIds.join(",") : "");

    const path = `/api/v2/catalog/filters?${qp.toString()}`;
    const { res, data } = await this.getJsonWithRetry<any>(path);

    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }

    return VintedCatalogFiltersResponseSchema.parse(data);
  }

  async getFacetedCategories(params: {
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<VintedFacetedCategoriesResponse> {
    const time = Math.floor(Date.now() / 1000);
    const qp = new URLSearchParams();
    qp.set("catalog_ids", params.catalogIds?.length ? params.catalogIds.join(",") : "");
    qp.set("currency", params.currency);
    qp.set("time", String(time));
    qp.set("size_ids", params.sizeIds?.length ? params.sizeIds.join(",") : "");
    qp.set("brand_ids", params.brandIds?.length ? params.brandIds.join(",") : "");
    qp.set("status_ids", params.statusIds?.length ? params.statusIds.join(",") : "");
    qp.set("color_ids", params.colorIds?.length ? params.colorIds.join(",") : "");
    qp.set("material_ids", params.materialIds?.length ? params.materialIds.join(",") : "");

    const path = `/api/v2/catalog/faceted_categories?${qp.toString()}`;
    const { res, data } = await this.getJsonWithRetry<any>(path);
    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }
    return VintedFacetedCategoriesResponseSchema.parse(data);
  }

  async getFilterFacets(params: {
    filterCode: string;
    searchText: string;
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<VintedFilterFacetsResponse> {
    const qp = new URLSearchParams();
    qp.set("search_text", params.searchText);
    qp.set("catalog_ids", params.catalogIds?.length ? params.catalogIds.join(",") : "");
    qp.set("currency", params.currency);
    qp.set("filter_code", params.filterCode);
    qp.set("size_ids", params.sizeIds?.length ? params.sizeIds.join(",") : "");
    qp.set("brand_ids", params.brandIds?.length ? params.brandIds.join(",") : "");
    qp.set("status_ids", params.statusIds?.length ? params.statusIds.join(",") : "");
    qp.set("color_ids", params.colorIds?.length ? params.colorIds.join(",") : "");
    qp.set("material_ids", params.materialIds?.length ? params.materialIds.join(",") : "");

    const path = `/api/v2/catalog/filters/facets?${qp.toString()}`;
    const { res, data } = await this.getJsonWithRetry<any>(path);
    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }
    return VintedFilterFacetsResponseSchema.parse(data);
  }

  async searchFilterOptions(params: {
    filterSearchCode: string;
    searchText: string;
    currency: string;
    catalogIds?: number[];
    sizeIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
  }): Promise<VintedFilterSearchResponse> {
    const qp = new URLSearchParams();
    qp.set("filter_search_code", params.filterSearchCode);
    qp.set("search_text", params.searchText);
    qp.set("catalog_ids", params.catalogIds?.length ? params.catalogIds.join(",") : "");
    qp.set("currency", params.currency);
    qp.set("size_ids", params.sizeIds?.length ? params.sizeIds.join(",") : "");
    qp.set("brand_ids", params.brandIds?.length ? params.brandIds.join(",") : "");
    qp.set("status_ids", params.statusIds?.length ? params.statusIds.join(",") : "");
    qp.set("color_ids", params.colorIds?.length ? params.colorIds.join(",") : "");
    qp.set("material_ids", params.materialIds?.length ? params.materialIds.join(",") : "");

    const path = `/api/v2/catalog/filters/search?${qp.toString()}`;
    const { res, data } = await this.getJsonWithRetry<any>(path);
    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }
    return VintedFilterSearchResponseSchema.parse(data);
  }

  async getBrand(id: number): Promise<VintedBrandResponse> {
    const path = `/api/v2/brands/${id}`;
    const { res, data } = await this.getJsonWithRetry<any>(path);
    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }
    return VintedBrandResponseSchema.parse(data);
  }

  async getItemHtml(id: number): Promise<{ html: string; finalUrl: string | null }> {
    // We intentionally fetch the public item HTML (not API) as a fallback when the item-details API
    // is not observable. Requires valid session cookies/headers.
    const path = `/items/${id}`;
    const { res, data } = await this.getJsonWithRetry<any>(path, { responseType: "text" });
    if (res.status < 200 || res.status >= 300) {
      const err = new Error(`Vinted upstream error: ${res.status} ${res.statusText}`);
      (err as any).upstreamStatus = res.status;
      (err as any).upstreamBody = data;
      throw err;
    }
    return {
      html: typeof data === "string" ? data : String(data),
      finalUrl: (res.request as any)?.res?.responseUrl ?? null
    };
  }
}
