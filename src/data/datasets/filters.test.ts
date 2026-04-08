import { buildFlagsAttributeFilters, buildPokemonAttributeFilters } from "./filters";
import { CONTINENT_OPTIONS, GENERATION_OPTIONS } from "./types";

describe("dataset filter builders", () => {
  it("flags: all continents omits continent constraint", () => {
    const filters = buildFlagsAttributeFilters({
      allContinentsSelected: true,
      selectedContinents: [...CONTINENT_OPTIONS],
      independentOnly: false
    });
    expect(filters.includeAny?.continent).toBeUndefined();
  });

  it("flags: selected continents are passed through", () => {
    const filters = buildFlagsAttributeFilters({
      allContinentsSelected: false,
      selectedContinents: ["Europe", "Africa"],
      independentOnly: true
    });
    expect(filters.includeAny?.continent).toEqual(["Europe", "Africa"]);
    expect(filters.requiredEquals?.independent).toBe(true);
  });

  it("pokemon: all generations omits generation constraint", () => {
    const filters = buildPokemonAttributeFilters({
      allGenerationsSelected: true,
      selectedGenerations: [...GENERATION_OPTIONS]
    });
    expect(filters.includeAny?.generation).toBeUndefined();
  });

  it("pokemon: subset filters by generation", () => {
    const filters = buildPokemonAttributeFilters({
      allGenerationsSelected: false,
      selectedGenerations: ["Gen I", "Gen II"]
    });
    expect(filters.includeAny?.generation).toEqual(["Gen I", "Gen II"]);
  });
});
