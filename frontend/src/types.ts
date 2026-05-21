export type SearchItem = {
  id: number;
  title: string;
  price: { minor: number; currency: string };
  imageUrl: string | null;
  url: string;
  brand: string | null;
  size: string | null;
  condition: string | null;
};

export type SearchResponse = {
  items: SearchItem[];
  page: number;
  perPage: number;
  totalPages: number | null;
  totalItems: number | null;
  facets: {
    brands: Array<{ value: string; count: number }>;
    sizes: Array<{ value: string; count: number }>;
    conditions: Array<{ value: string; count: number }>;
  };
};

export type CatalogOption = { id: number; title: string; count?: number; description?: string };
export type CatalogCategory = { id: number; title: string; parentId: number | null };
export type CatalogFiltersResponse = {
  categories: CatalogCategory[];
  brands?: CatalogOption[];
  sizes?: CatalogOption[];
  statuses?: CatalogOption[];
  colors?: CatalogOption[];
  materials?: CatalogOption[];
  filterDefinitions: Array<{
    code: string;
    title: string;
    displayType: string | null;
    selectionType: string | null;
    isLazy: boolean;
  }>;
};

export type CatalogFacetResponse = {
  filterCode: string;
  options: Array<{ id: number; title: string; count?: number; description?: string }>;
};
export type CatalogOptionsResponse = { options: CatalogOption[] };

export type ItemDetails = {
  id: number;
  title: string | null;
  description: string | null;
  url: string | null;
  source: "html_scrape";
};

export type Alert = {
  id: string;
  name: string;
  pollIntervalSeconds: number;
  createdAt: number;
  updatedAt: number;
  lastRunAt: number | null;
  lastError: string | null;
  query: {
    q: string;
    perPage: number;
    sort: "newest";
    currency?: string;
    priceMin?: number;
    priceMax?: number;
    catalogIds?: number[];
    brandIds?: number[];
    statusIds?: number[];
    colorIds?: number[];
    materialIds?: number[];
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
  };
};

export type AlertEvent = {
  id: string;
  alertId: string;
  type: "item.new" | "alert.error";
  createdAt: number;
  payload: any;
};
