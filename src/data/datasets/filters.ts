import { AttributeFilterSet } from "../filters/attributeFilters";
import { ContinentKey, GenerationLabel } from "./types";

export type FlagsFilterState = {
  allContinentsSelected: boolean;
  selectedContinents: ContinentKey[];
  independentOnly: boolean;
};

export type PokemonFilterState = {
  allGenerationsSelected: boolean;
  selectedGenerations: GenerationLabel[];
};

export const buildFlagsAttributeFilters = (state: FlagsFilterState): AttributeFilterSet => ({
  requiredEquals: state.independentOnly ? { independent: true } : {},
  includeAny: state.allContinentsSelected
    ? {}
    : {
        continent: state.selectedContinents
      }
});

export const buildPokemonAttributeFilters = (state: PokemonFilterState): AttributeFilterSet => ({
  requiredEquals: {},
  includeAny: state.allGenerationsSelected
    ? {}
    : {
        generation: state.selectedGenerations
      }
});
