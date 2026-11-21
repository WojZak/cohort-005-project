import { db } from "~/db";
import { listBrowsableCategories, type Db } from "./lib/catalog";
import { countPublishedCourses, listFeaturedCourses } from "./lib/featured";

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

    /** How many courses are published. Drafts and archived are not counted. */
    countPublishedCourses() {
      return countPublishedCourses(database);
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const catalog = /* @__PURE__ */ createCatalog(db);
