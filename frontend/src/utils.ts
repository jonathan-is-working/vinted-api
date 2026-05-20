export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const fmtPrice = (minor: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);

export const conditionDescriptions: Record<string, string> = {
  "Neuf avec étiquette":
    "Article neuf, jamais porté/utilisé avec étiquettes ou dans son emballage d’origine.",
  "Neuf sans étiquette":
    "Article neuf, jamais porté/utilisé, sans étiquettes ni emballage d’origine.",
  "Très bon état":
    "Article très peu porté/utilisé qui peut présenter de légères imperfections, mais qui reste en très bon état.",
  "Bon état":
    "Article porté/utilisé quelques fois, présentant des imperfections et des signes d’usure.",
  Satisfaisant:
    "Article porté/utilisé plusieurs fois, présentant des imperfections et des signes d’usure."
};

export const defaultStatusOptions = [
  { id: 6, title: "Neuf avec étiquette" },
  { id: 1, title: "Neuf sans étiquette" },
  { id: 2, title: "Très bon état" },
  { id: 3, title: "Bon état" },
  { id: 4, title: "Satisfaisant" }
] as const;

const statusRank: Record<number, number> = {
  6: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4
};

export function sortStatuses<T extends { id: number }>(opts: T[]): T[] {
  return [...opts].sort((a, b) => {
    const ra = statusRank[a.id] ?? 999;
    const rb = statusRank[b.id] ?? 999;
    return ra - rb;
  });
}
