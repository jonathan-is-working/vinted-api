import React from "react";
import { CatalogOption, type CatalogCategory } from "../types";
import { cx, conditionDescriptions, defaultStatusOptions, sortStatuses } from "../utils";
import { Icon, type IconName } from "./Icon";
import { SIZE_PRESETS } from "../sizePresets";

function togglePick(arr: CatalogOption[], opt: CatalogOption) {
  return arr.some((x) => x.id === opt.id) ? arr.filter((x) => x.id !== opt.id) : [...arr, opt];
}

function looksLikeTopLevelCatalog(title: string) {
  const t = title.toLowerCase();
  return (
    t.includes("femme") ||
    t.includes("homme") ||
    t.includes("enfant") ||
    t.includes("maison") ||
    t.includes("électron") ||
    t.includes("electron") ||
    t.includes("divertissement") ||
    t.includes("sport") ||
    t.includes("loisir") ||
    t.includes("collection")
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
      {children}
    </span>
  );
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
      className="group rounded-2xl border border-slate-200/60 bg-white/85 shadow-sm backdrop-blur"
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

function SelectedChips({
  values,
  onRemove
}: {
  values: CatalogOption[];
  onRemove: (id: number) => void;
}) {
  if (!values.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <span
          key={v.id}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white"
        >
          <span className="max-w-[220px] truncate">{v.title}</span>
          <button onClick={() => onRemove(v.id)} className="opacity-80 hover:opacity-100">
            <Icon name="close" className="text-[14px]" />
          </button>
        </span>
      ))}
    </div>
  );
}

function FacetList({
  options,
  selected,
  onToggle,
  emptyText,
  limit = 28
}: {
  options: Array<{ id: number; title: string; count?: number }>;
  selected: CatalogOption[];
  onToggle: (opt: CatalogOption) => void;
  emptyText: string;
  limit?: number;
}) {
  if (!options.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-center text-[12px] text-slate-600">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.slice(0, limit).map((o) => {
        const picked = selected.some((x) => x.id === o.id);
        return (
          <button
            key={o.id}
            className={cx(
              "rounded-xl border px-3 py-2 text-left transition",
              picked ? "border-blue-300 bg-blue-50/70" : "border-slate-200/60 bg-white/70 hover:bg-white"
            )}
            onClick={() => onToggle({ id: o.id, title: o.title })}
            title={o.title}
          >
            <div className="flex items-start gap-2">
              <div
                className={cx(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  picked ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 bg-slate-50"
                )}
              >
                {picked ? <Icon name="check" className="text-[12px]" /> : null}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-bold text-slate-900">{o.title}</div>
                <span className="text-[10px] text-slate-500">{typeof o.count === "number" ? o.count : ""}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function FiltersModal(props: {
  open: boolean;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };

  sort: string;
  setSort: (v: any) => void;
  currency: string;
  setCurrency: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categoryOptions: Array<{ id: number; label: string }>;

  facetBrands: Array<{ id: number; title: string; count?: number }>;
  facetSizes: Array<{ id: number; title: string; count?: number }>;
  facetColors: Array<{ id: number; title: string; count?: number }>;
  facetMaterials: Array<{ id: number; title: string; count?: number }>;

  brandSelected: CatalogOption[];
  setBrandSelected: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;

  sizeSelectedWomen: CatalogOption[];
  setSizeSelectedWomen: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedWomenShoes: CatalogOption[];
  setSizeSelectedWomenShoes: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedBras: CatalogOption[];
  setSizeSelectedBras: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedWomenBelts: CatalogOption[];
  setSizeSelectedWomenBelts: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMen: CatalogOption[];
  setSizeSelectedMen: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenShoes: CatalogOption[];
  setSizeSelectedMenShoes: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedRings: CatalogOption[];
  setSizeSelectedRings: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedAdultHats: CatalogOption[];
  setSizeSelectedAdultHats: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedAdultGloves: CatalogOption[];
  setSizeSelectedAdultGloves: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedWatches: CatalogOption[];
  setSizeSelectedWatches: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenBelts: CatalogOption[];
  setSizeSelectedMenBelts: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenSocks: CatalogOption[];
  setSizeSelectedMenSocks: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenShirts: CatalogOption[];
  setSizeSelectedMenShirts: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenSuitJackets: CatalogOption[];
  setSizeSelectedMenSuitJackets: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  sizeSelectedMenPants: CatalogOption[];
  setSizeSelectedMenPants: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;

  statusOptions: CatalogOption[];
  statusSelected: CatalogOption[];
  setStatusSelected: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  colorSelected: CatalogOption[];
  setColorSelected: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
  materialSelected: CatalogOption[];
  setMaterialSelected: (fn: (prev: CatalogOption[]) => CatalogOption[]) => void;
}) {
  if (!props.open) return null;

  const statusList = sortStatuses(
    (props.statusOptions?.length
      ? props.statusOptions
      : (defaultStatusOptions as unknown as CatalogOption[])) as CatalogOption[]
  );

  const safeSizes = props.facetSizes.filter((s) => !looksLikeTopLevelCatalog(s.title));

  const allSizesCount =
    props.sizeSelectedWomen.length +
    props.sizeSelectedWomenShoes.length +
    props.sizeSelectedBras.length +
    props.sizeSelectedWomenBelts.length +
    props.sizeSelectedMen.length +
    props.sizeSelectedMenShoes.length +
    props.sizeSelectedRings.length +
    props.sizeSelectedAdultHats.length +
    props.sizeSelectedAdultGloves.length +
    props.sizeSelectedWatches.length +
    props.sizeSelectedMenBelts.length +
    props.sizeSelectedMenSocks.length +
    props.sizeSelectedMenShirts.length +
    props.sizeSelectedMenSuitJackets.length +
    props.sizeSelectedMenPants.length;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={props.onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:bottom-auto sm:top-6 sm:w-[min(980px,calc(100vw-24px))]">
        <div className="max-h-[90dvh] rounded-t-3xl border border-white/30 bg-white/90 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:bg-white/70">
          <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/40 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Icon name="tune" className="text-[22px]" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-800 tracking-tight">Filters</div>
                <div className="text-[11px] font-medium text-slate-500">
                  Keep it tight: fewer clicks, faster cop.
                </div>
              </div>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={props.onClose}
              title="Close"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="max-h-[calc(90dvh-80px)] overflow-y-auto p-4 custom-scrollbar sm:max-h-[calc(100vh-140px)] sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Section title="Core" icon="tune" defaultOpen>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Sort
                      </label>
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={props.sort}
                        onChange={(e) => props.setSort(e.target.value)}
                      >
                        <option value="newest">Newest</option>
                        <option value="relevance">Relevance</option>
                        <option value="price_asc">Price ↑</option>
                        <option value="price_desc">Price ↓</option>
                      </select>
                    </div>
                    <div>
                      <label className="ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Currency
                      </label>
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={props.currency}
                        onChange={(e) => props.setCurrency(e.target.value)}
                      >
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Min €
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={props.priceMin}
                        onChange={(e) => props.setPriceMin(e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Max €
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={props.priceMax}
                        onChange={(e) => props.setPriceMax(e.target.value)}
                        inputMode="decimal"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Category
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                      value={props.categoryId}
                      onChange={(e) => props.setCategoryId(e.target.value)}
                    >
                      <option value="">All</option>
                      {props.categoryOptions.slice(0, 500).map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>

              <Section
                title="Brand"
                icon="factory"
                badge={props.brandSelected.length ? <Badge>{props.brandSelected.length}</Badge> : undefined}
              >
                <div className="space-y-2">
                  <SelectedChips
                    values={props.brandSelected}
                    onRemove={(id) => props.setBrandSelected((prev) => prev.filter((x) => x.id !== id))}
                  />
                  <FacetList
                    options={props.facetBrands}
                    selected={props.brandSelected}
                    onToggle={(opt) => props.setBrandSelected((prev) => togglePick(prev, opt))}
                    emptyText="Type a query to populate brands."
                  />
                </div>
              </Section>

              <Section
                title="Size"
                icon="straighten"
                badge={allSizesCount ? <Badge>{allSizesCount}</Badge> : undefined}
              >
                <div className="space-y-2">
                  <SelectedChips
                    values={[
                      ...props.sizeSelectedWomen,
                      ...props.sizeSelectedWomenShoes,
                      ...props.sizeSelectedBras,
                      ...props.sizeSelectedWomenBelts,
                      ...props.sizeSelectedMen,
                      ...props.sizeSelectedMenShoes,
                      ...props.sizeSelectedRings,
                      ...props.sizeSelectedAdultHats,
                      ...props.sizeSelectedAdultGloves,
                      ...props.sizeSelectedWatches,
                      ...props.sizeSelectedMenBelts,
                      ...props.sizeSelectedMenSocks,
                      ...props.sizeSelectedMenShirts,
                      ...props.sizeSelectedMenSuitJackets,
                      ...props.sizeSelectedMenPants
                    ]}
                    onRemove={(id) => {
                      props.setSizeSelectedWomen((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedWomenShoes((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedBras((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedWomenBelts((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMen((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenShoes((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedRings((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedAdultHats((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedAdultGloves((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedWatches((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenBelts((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenSocks((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenShirts((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenSuitJackets((prev) => prev.filter((x) => x.id !== id));
                      props.setSizeSelectedMenPants((prev) => prev.filter((x) => x.id !== id));
                    }}
                  />

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Femme (vêtements)
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.women_clothing.options}
                      selected={props.sizeSelectedWomen}
                      onToggle={(opt) => props.setSizeSelectedWomen((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Femme (chaussures)
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.women_shoes.options}
                      selected={props.sizeSelectedWomenShoes}
                      onToggle={(opt) => props.setSizeSelectedWomenShoes((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Soutiens-gorge
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.bras.options}
                      selected={props.sizeSelectedBras}
                      onToggle={(opt) => props.setSizeSelectedBras((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Ceintures femme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.women_belts.options}
                      selected={props.sizeSelectedWomenBelts}
                      onToggle={(opt) => props.setSizeSelectedWomenBelts((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Homme (vêtements)
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_clothing.options}
                      selected={props.sizeSelectedMen}
                      onToggle={(opt) => props.setSizeSelectedMen((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Homme (chaussures)
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_shoes.options}
                      selected={props.sizeSelectedMenShoes}
                      onToggle={(opt) => props.setSizeSelectedMenShoes((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Bagues
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.rings.options}
                      selected={props.sizeSelectedRings}
                      onToggle={(opt) => props.setSizeSelectedRings((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Chapeaux adulte
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.adult_hats.options}
                      selected={props.sizeSelectedAdultHats}
                      onToggle={(opt) => props.setSizeSelectedAdultHats((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Gants adulte
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.adult_gloves.options}
                      selected={props.sizeSelectedAdultGloves}
                      onToggle={(opt) => props.setSizeSelectedAdultGloves((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Montres
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.watches.options}
                      selected={props.sizeSelectedWatches}
                      onToggle={(opt) => props.setSizeSelectedWatches((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Ceintures homme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_belts.options}
                      selected={props.sizeSelectedMenBelts}
                      onToggle={(opt) => props.setSizeSelectedMenBelts((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Chaussettes homme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_socks.options}
                      selected={props.sizeSelectedMenSocks}
                      onToggle={(opt) => props.setSizeSelectedMenSocks((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Chemises homme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_shirts.options}
                      selected={props.sizeSelectedMenShirts}
                      onToggle={(opt) => props.setSizeSelectedMenShirts((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Vestes costume homme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_suit_jackets.options}
                      selected={props.sizeSelectedMenSuitJackets}
                      onToggle={(opt) => props.setSizeSelectedMenSuitJackets((prev) => togglePick(prev, opt))}
                      emptyText="—"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Pantalons homme
                    </div>
                    <FacetList
                      options={SIZE_PRESETS.men_pants.options}
                      selected={props.sizeSelectedMenPants}
                      onToggle={(opt) => props.setSizeSelectedMenPants((prev) => togglePick(prev, opt))}
                      emptyText="—"
                      limit={20}
                    />
                  </div>
                </div>
              </Section>

              <Section
                title="Condition"
                icon="verified"
                badge={props.statusSelected.length ? <Badge>{props.statusSelected.length}</Badge> : undefined}
              >
                <div className="grid gap-2">
                  {statusList.map((s) => {
                    const picked = props.statusSelected.some((x) => x.id === s.id);
                    return (
                      <button
                        key={s.id}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-left transition",
                          picked
                            ? "border-blue-300 bg-blue-50/70"
                            : "border-slate-200/60 bg-white/70 hover:bg-white"
                        )}
                        onClick={() =>
                          props.setStatusSelected((prev) => togglePick(prev, { id: s.id, title: s.title }))
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cx(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              picked
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-slate-300 bg-slate-50"
                            )}
                          >
                            {picked ? <Icon name="check" className="text-[12px]" /> : null}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-slate-900">{s.title}</div>
                            {conditionDescriptions[s.title] ? (
                              <div className="mt-0.5 text-[10px] leading-snug text-slate-500">
                                {conditionDescriptions[s.title]}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section
                title="Color"
                icon="palette"
                badge={props.colorSelected.length ? <Badge>{props.colorSelected.length}</Badge> : undefined}
              >
                <div className="space-y-2">
                  <SelectedChips
                    values={props.colorSelected}
                    onRemove={(id) => props.setColorSelected((prev) => prev.filter((x) => x.id !== id))}
                  />
                  <FacetList
                    options={props.facetColors}
                    selected={props.colorSelected}
                    onToggle={(opt) => props.setColorSelected((prev) => togglePick(prev, opt))}
                    emptyText="Type a query to populate colors."
                  />
                </div>
              </Section>

              <Section
                title="Material"
                icon="layers"
                badge={props.materialSelected.length ? <Badge>{props.materialSelected.length}</Badge> : undefined}
              >
                <div className="space-y-2">
                  <SelectedChips
                    values={props.materialSelected}
                    onRemove={(id) => props.setMaterialSelected((prev) => prev.filter((x) => x.id !== id))}
                  />
                  <FacetList
                    options={props.facetMaterials}
                    selected={props.materialSelected}
                    onToggle={(opt) => props.setMaterialSelected((prev) => togglePick(prev, opt))}
                    emptyText="Type a query to populate materials."
                  />
                </div>
              </Section>

              {props.categoryId && safeSizes.length ? (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-[12px] text-slate-600">
                  Category-specific sizes detected upstream. This UI uses your fixed presets (stable ids) for maximum
                  reliability.
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/40">
            {props.primaryAction ? (
              <button
                className={cx(
                  "rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all",
                  props.primaryAction.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                )}
                disabled={props.primaryAction.disabled}
                onClick={props.primaryAction.onClick}
              >
                {props.primaryAction.label}
              </button>
            ) : null}
            <button
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all"
              onClick={props.onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
