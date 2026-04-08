export type DatasetId = "flags" | "pokemon";

/** Reserved for future use; no fetch/UI until a suitable API exists. */
export type DatasetIdDeferred = "footballEu";

export type ContinentKey =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export const CONTINENT_OPTIONS: ContinentKey[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania"
];

export type GenerationLabel =
  | "Gen I"
  | "Gen II"
  | "Gen III"
  | "Gen IV"
  | "Gen V"
  | "Gen VI"
  | "Gen VII"
  | "Gen VIII"
  | "Gen IX";

export const GENERATION_OPTIONS: GenerationLabel[] = [
  "Gen I",
  "Gen II",
  "Gen III",
  "Gen IV",
  "Gen V",
  "Gen VI",
  "Gen VII",
  "Gen VIII",
  "Gen IX"
];
