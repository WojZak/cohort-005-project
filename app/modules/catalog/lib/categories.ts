import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, count, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { categories, courses, CourseStatus } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  hasPublishedCourse: boolean;
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// No limit: categories are curated by hand by an admin, so the table does not
// grow with the product's age.
export function listCategories(db: Db): CatalogCategory[] {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      publishedCourses: count(courses.id),
    })
    .from(categories)
    .leftJoin(
      courses,
      and(
        eq(courses.categoryId, categories.id),
        eq(courses.status, CourseStatus.Published)
      )
    )
    .groupBy(categories.id)
    .orderBy(categories.name)
    .all()
    .map(({ publishedCourses, ...category }) => ({
      ...category,
      hasPublishedCourse: publishedCourses > 0,
    }));
}

function assertNameAndSlugFree(
  db: Db,
  { name, slug }: { name: string; slug: string },
  exceptId?: number
) {
  const byName = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .get();
  if (byName && byName.id !== exceptId) {
    throw new Error(`A category with the name "${name}" already exists.`);
  }

  const bySlug = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .get();
  if (bySlug && bySlug.id !== exceptId) {
    throw new Error(`A category with the slug "${slug}" already exists.`);
  }
}

export function createCategory(db: Db, name: string) {
  const slug = slugify(name);
  assertNameAndSlugFree(db, { name, slug });
  return db.insert(categories).values({ name, slug }).returning().get();
}

export function renameCategory(db: Db, id: number, name: string) {
  const slug = slugify(name);
  assertNameAndSlugFree(db, { name, slug }, id);
  return db
    .update(categories)
    .set({ name, slug })
    .where(eq(categories.id, id))
    .returning()
    .get();
}
