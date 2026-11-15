import { db } from "~/db";
import { listBrowsableCategories, type Db } from "./lib/catalog";

export type { BrowsableCategory } from "./lib/catalog";

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
  };
}

export const catalog = createCatalog(db);
