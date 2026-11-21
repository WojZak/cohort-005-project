// The catalog page lists at most this many courses. A count that links to the
// catalog caps at the same number, so it never promises courses the page omits.
export const CATALOG_PAGE_SIZE = 50;

export function catalogUrlForCategory(slug: string) {
  return `/courses?${new URLSearchParams({ category: slug })}`;
}
