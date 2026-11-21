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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCategoryBySlug(db: Db, slug: string) {
  return db.select().from(categories).where(eq(categories.slug, slug)).get();
}

function getCategoryByName(db: Db, name: string) {
  return db.select().from(categories).where(eq(categories.name, name)).get();
}

// The slug is derived from the name, so two names can collide on one slug;
// both are checked so the admin sees which one is taken.
function assertCategoryNameFree(
  db: Db,
  { name, slug }: { name: string; slug: string },
  id?: number
) {
  const byName = getCategoryByName(db, name);
  if (byName && byName.id !== id) {
    throw new Error(`A category with the name "${name}" already exists.`);
  }
  const bySlug = getCategoryBySlug(db, slug);
  if (bySlug && bySlug.id !== id) {
    throw new Error(`A category with the slug "${slug}" already exists.`);
  }
}

export function createCategory(db: Db, name: string) {
  const slug = slugify(name);
  assertCategoryNameFree(db, { name, slug });
  return db.insert(categories).values({ name, slug }).returning().get();
}

export function renameCategory(db: Db, id: number, name: string) {
  const slug = slugify(name);
  assertCategoryNameFree(db, { name, slug }, id);
  return db
    .update(categories)
    .set({ name, slug })
    .where(eq(categories.id, id))
    .returning()
    .get();
}
