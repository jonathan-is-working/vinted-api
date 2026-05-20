import { type Env } from "../config/env.js";
import { type VintedClient } from "../upstream/vinted.client.js";
import { type SearchQuery, type SearchResponse } from "./search.types.js";
import {
  SIZE_IDS_14_TO_TITLE,
  SIZE_IDS_38_TO_TITLE,
  SIZE_IDS_4_TO_TITLE,
  SIZE_IDS_52_TO_TITLE,
  SIZE_IDS_60_TO_TITLE,
  SIZE_IDS_61_TO_TITLE,
  SIZE_IDS_62_TO_TITLE,
  SIZE_IDS_63_TO_TITLE,
  SIZE_IDS_73_TO_TITLE,
  SIZE_IDS_74_TO_TITLE,
  SIZE_IDS_75_TO_TITLE,
  SIZE_IDS_77_TO_TITLE
} from "./size.presets.js";

function priceToMinor(amount: string): number {
  // Vinted gives strings like "40.0". Normalize to minor units (cents).
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function pickImageUrl(vintedItem: {
  photo?: { url: string } | undefined;
  photos?: Array<{ url: string; is_main?: boolean | undefined }> | undefined;
}): string | null {
  if (vintedItem.photo?.url) return vintedItem.photo.url;
  const mainPhoto = vintedItem.photos?.find((p) => p.is_main);
  if (mainPhoto?.url) return mainPhoto.url;
  const first = vintedItem.photos?.[0];
  return first?.url ?? null;
}

export class SearchService {
  constructor(
    private readonly vinted: VintedClient,
    private readonly env: Env
  ) {}

  async search(input: SearchQuery, opts?: { fillToPerPage?: boolean }): Promise<SearchResponse> {
    const priceFrom =
      typeof input.priceMin === "number" ? Math.floor(input.priceMin / 100) : undefined;
    const priceTo =
      typeof input.priceMax === "number" ? Math.ceil(input.priceMax / 100) : undefined;

    const order =
      input.sort === "relevance"
        ? this.env.VINTED_ORDER
        : input.sort === "newest"
          ? "newest_first"
          : input.sort === "price_asc"
            ? "price_low_to_high"
            : "price_high_to_low";

    type MappedItem = {
      id: number;
      title: string;
      price: { minor: number; currency: string };
      imageUrl: string | null;
      url: string;
      brand: string | null;
      size: string | null;
      condition: string | null;
    };

    const mapItems = (items: Array<any>): MappedItem[] =>
      items.map((it) => ({
        id: it.id,
        title: it.title,
        price: { minor: priceToMinor(it.price.amount), currency: it.price.currency_code },
        imageUrl: pickImageUrl(it),
        url: it.url,
        brand: it.brand_title ?? null,
        size: it.size_title ?? null,
        condition: it.status ?? null
      }));

    const facetCounts = (values: Array<string | null>) => {
      const map = new Map<string, number>();
      for (const v of values) {
        if (!v) continue;
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    };

    const allowedSizeTitles = (() => {
      const set = new Set<string>();
      if (input.sizeIds4?.length) {
        for (const id of input.sizeIds4) {
          const t = SIZE_IDS_4_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds14?.length) {
        for (const id of input.sizeIds14) {
          const t = SIZE_IDS_14_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds38?.length) {
        for (const id of input.sizeIds38) {
          const t = SIZE_IDS_38_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds52?.length) {
        for (const id of input.sizeIds52) {
          const t = SIZE_IDS_52_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds60?.length) {
        for (const id of input.sizeIds60) {
          const t = SIZE_IDS_60_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds61?.length) {
        for (const id of input.sizeIds61) {
          const t = SIZE_IDS_61_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds62?.length) {
        for (const id of input.sizeIds62) {
          const t = SIZE_IDS_62_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds63?.length) {
        for (const id of input.sizeIds63) {
          const t = SIZE_IDS_63_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds73?.length) {
        for (const id of input.sizeIds73) {
          const t = SIZE_IDS_73_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds74?.length) {
        for (const id of input.sizeIds74) {
          const t = SIZE_IDS_74_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds75?.length) {
        for (const id of input.sizeIds75) {
          const t = SIZE_IDS_75_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      if (input.sizeIds77?.length) {
        for (const id of input.sizeIds77) {
          const t = SIZE_IDS_77_TO_TITLE[id];
          if (t) set.add(t);
        }
      }
      // If legacy sizeIds is used, we can't reliably map ids->titles, so don't enforce it here.
      return set.size ? set : null;
    })();

    const matchOpt = (needle: string | undefined, hay: string | null) => {
      if (!needle) return true;
      return (hay ?? "").toLowerCase() === needle.toLowerCase();
    };

    const applyLocalFilters = (items: MappedItem[]) =>
      items.filter(
        (i) =>
          (!allowedSizeTitles || (i.size != null && allowedSizeTitles.has(i.size))) &&
          matchOpt(input.brand, i.brand) &&
          matchOpt(input.size, i.size) &&
          matchOpt(input.condition, i.condition)
      );

    // If we have strict grouped size filters, Vinted sometimes returns fewer-than-requested items
    // (or leaks items with missing/odd size fields). To keep UX stable, we over-fetch pages and
    // fill the requested perPage count with locally-validated items.
    const fillToPerPage = opts?.fillToPerPage ?? true;
    const needsFill = fillToPerPage && allowedSizeTitles != null;
    if (needsFill) {
      const fetchPerPage = Math.max(input.perPage, this.env.VINTED_PER_PAGE);
      const maxPagesToScan = 6;
      const collected: Array<ReturnType<typeof mapItems>[number]> = [];

      for (let i = 0; i < maxPagesToScan && collected.length < input.perPage; i++) {
        const upstream = await this.vinted.searchCatalogItems({
          searchText: input.q,
          page: input.page + i,
          perPage: fetchPerPage,
          order,
          priceFrom,
          priceTo,
          currency: input.currency,
          catalogIds: input.catalogIds,
          brandIds: input.brandIds,
          sizeIds: input.sizeIds,
          sizeIds4: input.sizeIds4,
          sizeIds14: input.sizeIds14,
          sizeIds38: input.sizeIds38,
          sizeIds52: input.sizeIds52,
          sizeIds60: input.sizeIds60,
          sizeIds61: input.sizeIds61,
          sizeIds62: input.sizeIds62,
          sizeIds63: input.sizeIds63,
          sizeIds73: input.sizeIds73,
          sizeIds74: input.sizeIds74,
          sizeIds75: input.sizeIds75,
          sizeIds77: input.sizeIds77,
          statusIds: input.statusIds,
          colorIds: input.colorIds,
          materialIds: input.materialIds
        });
        const mapped = mapItems(upstream.items);
        const filtered = applyLocalFilters(mapped);
        collected.push(...filtered);

        // Stop early if upstream is exhausted.
        const totalPages = upstream.pagination?.total_pages;
        if (typeof totalPages === "number" && totalPages > 0 && input.page + i >= totalPages) break;
        if (!upstream.items.length) break;
      }

      const pageItems = collected.slice(0, input.perPage);
      const facets = {
        brands: facetCounts(pageItems.map((i) => i.brand)),
        sizes: facetCounts(pageItems.map((i) => i.size)),
        conditions: facetCounts(pageItems.map((i) => i.condition))
      };

      return {
        items: pageItems,
        page: input.page,
        perPage: input.perPage,
        // With client-side fill, we can't reliably expose total counts.
        totalPages: null,
        totalItems: null,
        facets
      };
    }

    const upstream = await this.vinted.searchCatalogItems({
      searchText: input.q,
      page: input.page,
      perPage: input.perPage,
      order,
      priceFrom,
      priceTo,
      currency: input.currency,
      catalogIds: input.catalogIds,
      brandIds: input.brandIds,
      sizeIds: input.sizeIds,
      sizeIds4: input.sizeIds4,
      sizeIds14: input.sizeIds14,
      sizeIds38: input.sizeIds38,
      sizeIds52: input.sizeIds52,
      sizeIds60: input.sizeIds60,
      sizeIds61: input.sizeIds61,
      sizeIds62: input.sizeIds62,
      sizeIds63: input.sizeIds63,
      sizeIds73: input.sizeIds73,
      sizeIds74: input.sizeIds74,
      sizeIds75: input.sizeIds75,
      sizeIds77: input.sizeIds77,
      statusIds: input.statusIds,
      colorIds: input.colorIds,
      materialIds: input.materialIds
    });

    const mapped = mapItems(upstream.items);
    const filtered = applyLocalFilters(mapped);
    const facets = {
      brands: facetCounts(mapped.map((i) => i.brand)),
      sizes: facetCounts(mapped.map((i) => i.size)),
      conditions: facetCounts(mapped.map((i) => i.condition))
    };

    return {
      items: filtered,
      page: upstream.pagination?.current_page ?? input.page,
      perPage: input.perPage,
      totalPages: upstream.pagination?.total_pages ?? null,
      totalItems: upstream.pagination?.total_entries ?? null,
      facets
    };
  }
}
