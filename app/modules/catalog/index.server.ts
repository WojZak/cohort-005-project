import { db } from "~/db";
import {
  createCategory,
  listBrowsableCategories,
  renameCategory,
  type Db,
} from "./lib/catalog";
import { countCatalogPageCourses, listFeaturedCourses } from "./lib/featured";

export type { BrowsableCategory } from "./lib/catalog";
export type { FeaturedCourse } from "./lib/featured";

/**
 * The course catalog bound to a database. The app uses `catalog`, which reads
 * the app database; tests build their own against a test database.
 */
export function createCatalog(database: Db) {
  return {
    /**
     * Categories that hold at least one published course, by name, each with
     * its published course count. Drafts and archived courses are not counted.
     */
    listBrowsableCategories() {
      return listBrowsableCategories(database);
    },

    /**
     * The newest published courses, up to `limit`, each with its instructor,
     * category and lesson count.
     */
    listFeaturedCourses(limit: number) {
      return listFeaturedCourses(database, limit);
    },

    /**
     * How many published courses the unfiltered catalog page lists: every
     * published course, capped at `CATALOG_PAGE_SIZE` as the page is.
     */
    countCatalogPageCourses() {
      return countCatalogPageCourses(database);
    },

    /**
     * A new category, its slug derived from the name. Throws when the name
     * or the slug is taken.
     */
    createCategory(name: string) {
      return createCategory(database, name);
    },

    /**
     * Renames a category and re-derives its slug. Throws when another
     * category holds the name or the slug.
     */
    renameCategory(id: number, name: string) {
      return renameCategory(database, id, name);
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const catalog = /* @__PURE__ */ createCatalog(db);
