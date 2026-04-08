import { QuizItem } from "../../domain/quiz";
import { GenerationLabel } from "../datasets/types";

const POKEAPI = "https://pokeapi.co/api/v2";
const CACHE_KEY = "5quiz.pokemon.v1";
const SPECIES_PAGE = `${POKEAPI}/pokemon-species`;
const CONCURRENCY = 8;

type ListResponse = {
  next: string | null;
  results: Array<{ name: string; url: string }>;
};

type SpeciesJson = {
  id: number;
  name: string;
  names: Array<{ name: string; language: { name: string } }>;
  generation: { name: string } | null;
  varieties: Array<{ is_default: boolean; pokemon: { name: string; url: string } }>;
};

type PokemonJson = {
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
  types: Array<{ type: { name: string } }>;
};

const GENERATION_MAP: Record<string, GenerationLabel> = {
  "generation-i": "Gen I",
  "generation-ii": "Gen II",
  "generation-iii": "Gen III",
  "generation-iv": "Gen IV",
  "generation-v": "Gen V",
  "generation-vi": "Gen VI",
  "generation-vii": "Gen VII",
  "generation-viii": "Gen VIII",
  "generation-ix": "Gen IX"
};

const capitalize = (s: string): string =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase();

const englishName = (species: SpeciesJson): string => {
  const entry = species.names.find((n) => n.language.name === "en");
  return entry?.name ?? capitalize(species.name.replace(/-/g, " "));
};

const mapGeneration = (species: SpeciesJson): GenerationLabel | null => {
  const key = species.generation?.name;
  if (!key) {
    return null;
  }
  return GENERATION_MAP[key] ?? null;
};

const defaultVarietyPokemonUrl = (species: SpeciesJson): string | null => {
  const def = species.varieties.find((v) => v.is_default);
  return def?.pokemon.url ?? species.varieties[0]?.pokemon.url ?? null;
};

const pictureFromPokemon = (pokemon: PokemonJson): string | null =>
  pokemon.sprites.other?.["official-artwork"]?.front_default ??
  pokemon.sprites.front_default;

const typesLabel = (pokemon: PokemonJson): string =>
  pokemon.types.map((t) => capitalize(t.type.name)).join(", ");

async function fetchAllSpeciesUrls(): Promise<string[]> {
  const urls: string[] = [];
  let next: string | null = `${SPECIES_PAGE}?limit=100`;
  while (next) {
    const response = await fetch(next);
    if (!response.ok) {
      throw new Error("Unable to list Pokemon species");
    }
    const data = (await response.json()) as ListResponse;
    for (const row of data.results) {
      urls.push(row.url);
    }
    next = data.next;
  }
  return urls;
}

async function mapSpeciesUrlToItem(speciesUrl: string): Promise<QuizItem | null> {
  const speciesResponse = await fetch(speciesUrl);
  if (!speciesResponse.ok) {
    return null;
  }
  const species = (await speciesResponse.json()) as SpeciesJson;
  const generation = mapGeneration(species);
  if (!generation) {
    return null;
  }
  const pokemonUrl = defaultVarietyPokemonUrl(species);
  if (!pokemonUrl) {
    return null;
  }
  const pokemonResponse = await fetch(pokemonUrl);
  if (!pokemonResponse.ok) {
    return null;
  }
  const pokemon = (await pokemonResponse.json()) as PokemonJson;
  const pictureUrl = pictureFromPokemon(pokemon);
  if (!pictureUrl) {
    return null;
  }
  const name = englishName(species);
  return {
    id: String(species.id),
    pictureUrl,
    name,
    attributes: {
      generation,
      types: typesLabel(pokemon)
    }
  };
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runner = async () => {
    while (true) {
      const idx = nextIndex;
      nextIndex += 1;
      if (idx >= items.length) {
        break;
      }
      results[idx] = await worker(items[idx]);
    }
  };

  const poolSize = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: poolSize }, runner));
  return results;
}

const loadCachedPokemon = (): QuizItem[] | null => {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as QuizItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

export const fetchPokemonDataset = async (): Promise<QuizItem[]> => {
  const cached = loadCachedPokemon();
  if (cached) {
    return cached;
  }

  const speciesUrls = await fetchAllSpeciesUrls();
  const mapped = await runPool(speciesUrls, CONCURRENCY, mapSpeciesUrlToItem);
  const items = mapped.filter((item): item is QuizItem => item !== null);
  items.sort((a, b) => a.name.localeCompare(b.name));
  if (items.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  }
  return items;
};
