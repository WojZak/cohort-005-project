export function catalogUrlForCategory(slug: string) {
  return `/courses?${new URLSearchParams({ category: slug })}`;
}
