Atomic Design structure

- atoms: Plus petites briques UI (sans logique métier). Chaque composant a son dossier: `atoms/<Nom>/index.tsx`. Ex: `ChakraDateInput`, `SuggestionsList`, `CloseableTag`.
- molecules: Composants composés d’atoms avec un seul rôle clair. Dossier par composant: `molecules/<Nom>/index.tsx`. Ex: `SearchBar`, `ChipsInput`, `Autocomplete`, `MultiSelect`, `RemovableChipsBar`, `AppliedFiltersChips`, `Pagination`, `ResultsToolbar`, `SkillSeriesControl`.
- organisms: Sections complètes combinant plusieurs molecules/atoms et logique. Dossier par composant: `organisms/<Nom>/index.tsx`. Ex: `FilterPanel`, `ResultsTable`, `Charts`, `CitySkillTrendView`, `JobDetailsModal`, `SavedSearches`, `ResultsSkeleton`, `ChartsSkeleton`.

Notes

- Les listes de suggestions étaient dupliquées dans plusieurs composants. Elles sont factorisées dans `atoms/SuggestionsList`.
- Les "chips" fermables sont factorisés via `atoms/CloseableTag`.
- Les listes de tags affichables/fermetures multiples sont gérées par `atoms/TagsList` ou `molecules/RemovableChipsBar`.
- Conservez cette granularité: privilégier la simplicité (un rôle / composant) et extraire au besoin.
