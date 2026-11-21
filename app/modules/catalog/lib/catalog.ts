import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { count, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { categories, courses, CourseStatus } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

export type BrowsableCategory = {
  id: number;
  name: string;
  slug: string;
  courseCount: number;
};

// Only categories with a published course are listed: a link to an empty
// catalog page is a dead end for the visitor who clicked it.
export function listBrowsableCategories(db: Db): BrowsableCategory[] {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      courseCount: count(courses.id),
    })
    .from(categories)
    .innerJoin(courses, eq(courses.categoryId, categories.id))
    .where(eq(courses.status, CourseStatus.Published))
    .groupBy(categories.id)
    .orderBy(categories.name)
    .all();
}
