import { QuizItem } from "../../domain/quiz";
import { fetchFlagsDataset } from "../providers/flagsProvider";
import { fetchPokemonDataset } from "../providers/pokemonProvider";
import { DatasetId } from "./types";

export type DatasetDefinition = {
  id: DatasetId;
  label: string;
  emoji: string;
  ariaLabel: string;
  cacheKey: string;
  fetchItems: () => Promise<QuizItem[]>;
};

export const DATASETS: DatasetDefinition[] = [
  {
    id: "flags",
    label: "Flags",
    emoji: "\uD83D\uDEA9",
    ariaLabel: "Quiz dataset: countries and flags",
    cacheKey: "5quiz.flags.v1",
    fetchItems: fetchFlagsDataset
  },
  {
    id: "pokemon",
    label: "Pokemon",
    emoji: "\uD83D\uDD34",
    ariaLabel: "Quiz dataset: Pokemon",
    cacheKey: "5quiz.pokemon.v1",
    fetchItems: fetchPokemonDataset
  }
];

/** footballEu: deferred — no suitable keyless CORS API for 2025–26 squads with logos. */

export const getDataset = (id: DatasetId): DatasetDefinition =>
  DATASETS.find((d) => d.id === id) ?? DATASETS[0];
