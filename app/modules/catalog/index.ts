/**
 * The browser-safe catalog entry point: links into the course catalog.
 * Server-only queries and writes live in `index.server.ts`.
 */
export { catalogUrlForCategory } from "./lib/catalog-url";
