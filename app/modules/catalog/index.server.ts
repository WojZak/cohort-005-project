import { db } from "~/db";
import {
  createCategory,
  listCategories,
  renameCategory,
  type Db,
} from "./lib/categories";

export type { CatalogCategory } from "./lib/categories";

/**
 * The course catalog's categories, bound to a database. The app uses
 * `catalog`, which reads the app database; tests build their own against a
 * test database.
 */
export function createCatalog(database: Db) {
  return {
    /**
     * Every category, by name. `hasPublishedCourse` is false for a category
     * whose courses are all drafts or archived, or that has none: its catalog
     * page would be empty.
     */
    listCategories() {
      return listCategories(database);
    },

    /**
     * Adds a category, its slug derived from the name. Throws when another
     * category already has the name or the slug.
     */
    createCategory(name: string) {
      return createCategory(database, name);
    },

    /**
     * Renames a category and re-derives its slug. Throws when another
     * category already has the name or the slug.
     */
    renameCategory(id: number, name: string) {
      return renameCategory(database, id, name);
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const catalog = /* @__PURE__ */ createCatalog(db);
