import { type CatalogOption } from "./types";

export type SizePresetKey =
  | "women_clothing"
  | "men_clothing"
  | "men_shoes"
  | "rings"
  | "adult_hats"
  | "adult_gloves"
  | "watches"
  | "men_belts"
  | "men_socks"
  | "men_shirts"
  | "men_suit_jackets"
  | "men_pants";

export const SIZE_PRESETS: Record<SizePresetKey, { label: string; options: CatalogOption[] }> = {
  // From Vinted web UI: name="size_ids_4[]" (women clothing sizes)
  women_clothing: {
    label: "Femme (Tailles vêtements)",
    options: [
      { id: 1226, title: "XXXS / 30 / 2" },
      { id: 102, title: "XXS / 32 / 4" },
      { id: 2, title: "XS / 34 / 6" },
      { id: 3, title: "S / 36 / 8" },
      { id: 4, title: "M / 38 / 10" },
      { id: 5, title: "L / 40 / 12" },
      { id: 6, title: "XL / 42 / 14" },
      { id: 7, title: "XXL / 44 / 16" },
      { id: 310, title: "XXXL / 46 / 18" },
      { id: 311, title: "4XL / 48 / 20" },
      { id: 312, title: "5XL / 50 / 22" },
      { id: 1227, title: "6XL / 52 / 24" },
      { id: 1228, title: "7XL / 54 / 26" },
      { id: 1229, title: "8XL / 56 / 28" },
      { id: 1230, title: "9XL / 58 / 30" },
      { id: 90, title: "Taille unique" },
      { id: 97, title: "Autre" }
    ]
  }
  ,
  // From Vinted web UI: name="size_ids_14[]" (men clothing sizes)
  men_clothing: {
    label: "Homme (Tailles vêtements)",
    options: [
      { id: 206, title: "XS" },
      { id: 207, title: "S" },
      { id: 208, title: "M" },
      { id: 209, title: "L" },
      { id: 210, title: "XL" },
      { id: 211, title: "XXL" },
      { id: 212, title: "XXXL" },
      { id: 308, title: "4XL" },
      { id: 309, title: "5XL" },
      { id: 1192, title: "6XL" },
      { id: 1193, title: "7XL" },
      { id: 213, title: "Taille unique" }
    ]
  }
  ,
  // From Vinted web UI: name="size_ids_38[]" (Chaussures hommes)
  men_shoes: {
    label: "Homme (Chaussures)",
    options: [
      { id: 776, title: "38" },
      { id: 777, title: "38,5" },
      { id: 778, title: "39" },
      { id: 779, title: "39,5" },
      { id: 780, title: "40" },
      { id: 781, title: "40,5" },
      { id: 782, title: "41" },
      { id: 783, title: "41,5" },
      { id: 784, title: "42" },
      { id: 785, title: "42,5" },
      { id: 786, title: "43" },
      { id: 787, title: "43,5" },
      { id: 788, title: "44" },
      { id: 789, title: "44,5" },
      { id: 790, title: "45" },
      { id: 792, title: "46" },
      { id: 794, title: "47" },
      { id: 795, title: "47,5" },
      { id: 1625, title: "Autre" }
    ]
  },
  // From Vinted web UI: name="size_ids_52[]" (Bagues)
  rings: {
    label: "Bagues",
    options: [
      { id: 1202, title: "14,1 mm" },
      { id: 1206, title: "15,7 mm" },
      { id: 1207, title: "16,1 mm" },
      { id: 1208, title: "16,5 mm" },
      { id: 1209, title: "16,9 mm" },
      { id: 1210, title: "17,3 mm" },
      { id: 1211, title: "17,7 mm" },
      { id: 1213, title: "18,5 mm" },
      { id: 1214, title: "19 mm" },
      { id: 1218, title: "20,6 mm" },
      { id: 1224, title: "Ajustable" }
    ]
  },
  // From Vinted web UI: name="size_ids_60[]" (Chapeaux adulte)
  adult_hats: {
    label: "Chapeaux adulte",
    options: [
      { id: 1389, title: "S" },
      { id: 1390, title: "M" },
      { id: 1391, title: "L" },
      { id: 1387, title: "Taille unique" },
      { id: 1373, title: "52" },
      { id: 1375, title: "54" },
      { id: 1376, title: "55" },
      { id: 1377, title: "56" },
      { id: 1379, title: "58" },
      { id: 1380, title: "59" },
      { id: 1381, title: "60" },
      { id: 1383, title: "62" }
    ]
  },
  // From Vinted web UI: name="size_ids_61[]" (Gants adulte)
  adult_gloves: {
    label: "Gants adulte",
    options: [
      { id: 1410, title: "6" },
      { id: 1412, title: "7" },
      { id: 1423, title: "Taille unique" },
      { id: 1425, title: "S" },
      { id: 1427, title: "L" }
    ]
  },
  // From Vinted web UI: name="size_ids_62[]" (Montres)
  watches: {
    label: "Montres",
    options: [
      { id: 1430, title: "30–38 mm" },
      { id: 1431, title: "39–42 mm" },
      { id: 1435, title: "Taille unique" }
    ]
  },
  // From Vinted web UI: name="size_ids_63[]" (Ceintures homme)
  men_belts: {
    label: "Ceintures homme",
    options: [
      { id: 1703, title: "75 cm" },
      { id: 1438, title: "90 cm" },
      { id: 1439, title: "95 cm" },
      { id: 1440, title: "100 cm" },
      { id: 1441, title: "105 cm" },
      { id: 1442, title: "110 cm" },
      { id: 1443, title: "115 cm" },
      { id: 1444, title: "120 cm" },
      { id: 1581, title: "Ajustable" }
    ]
  },
  // From Vinted web UI: name="size_ids_73[]" (Chaussettes homme)
  men_socks: {
    label: "Chaussettes homme",
    options: [
      { id: 1523, title: "S | 38–42" },
      { id: 1526, title: "Taille unique" }
    ]
  },
  // From Vinted web UI: name="size_ids_74[]" (Chemises homme)
  men_shirts: {
    label: "Chemises homme",
    options: [
      { id: 1528, title: "36 cm" },
      { id: 1529, title: "37 cm" },
      { id: 1530, title: "38 cm" },
      { id: 1531, title: "39 cm" },
      { id: 1533, title: "41 cm" },
      { id: 1535, title: "43 cm" },
      { id: 1536, title: "44 cm" }
    ]
  },
  // From Vinted web UI: name="size_ids_75[]" (Vestes de costume pour homme)
  men_suit_jackets: {
    label: "Vestes costume homme",
    options: [
      { id: 1586, title: "25" },
      { id: 1593, title: "44" },
      { id: 1594, title: "46" },
      { id: 1595, title: "48" },
      { id: 1596, title: "50" },
      { id: 1597, title: "52" },
      { id: 1598, title: "54" },
      { id: 1599, title: "56" },
      { id: 1600, title: "58" }
    ]
  },
  // From Vinted web UI: name="size_ids_77[]" (Pantalons homme)
  men_pants: {
    label: "Pantalons homme",
    options: [
      { id: 1631, title: "W23 | FR 32" },
      { id: 1632, title: "W24 | FR 34" },
      { id: 1633, title: "W25 | FR 34" },
      { id: 1634, title: "W26 | FR 36" },
      { id: 1635, title: "W27 | FR 36" },
      { id: 1636, title: "W28 | FR 38" },
      { id: 1637, title: "W29 | FR 38" },
      { id: 1638, title: "W30 | FR 40" },
      { id: 1639, title: "W31 | FR 40" },
      { id: 1640, title: "W32 | FR 42" },
      { id: 1641, title: "W33 | FR 42" },
      { id: 1642, title: "W34 | FR 44" },
      { id: 1662, title: "W35 | FR 44" },
      { id: 1643, title: "W36 | FR 46" },
      { id: 1644, title: "W38 | FR 48" },
      { id: 1645, title: "W40 | FR 50" },
      { id: 1646, title: "W42 | FR 52" },
      { id: 1647, title: "W44 | FR 54" },
      { id: 1648, title: "W46 | FR 56" },
      { id: 1649, title: "W48 | FR 58" },
      { id: 1704, title: "W50 | FR 60" },
      { id: 1705, title: "W52 | FR 62" },
      { id: 1706, title: "W54 | FR 64" }
    ]
  }
};
