export const buildItemFilters = (search, category) => {
  const filters = {};
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    filters.search = trimmedSearch;
  }

  if (category) {
    filters.category = category;
  }

  return filters;
};
