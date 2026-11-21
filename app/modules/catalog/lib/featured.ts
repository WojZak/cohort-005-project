import { count, desc, eq } from "drizzle-orm";
import {
  categories,
  courses,
  CourseStatus,
  lessons,
  modules,
  users,
} from "~/db/schema";
import type { Db } from "./catalog";

export type FeaturedCourse = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  instructorName: string;
  categoryName: string;
  lessonCount: number;
};

// One grouped query, so the landing page reads the lesson counts of every
// featured course at once rather than one query per card.
export function listFeaturedCourses(db: Db, limit: number): FeaturedCourse[] {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      coverImageUrl: courses.coverImageUrl,
      instructorName: users.name,
      categoryName: categories.name,
      lessonCount: count(lessons.id),
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(modules, eq(modules.courseId, courses.id))
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(eq(courses.status, CourseStatus.Published))
    .groupBy(courses.id)
    .orderBy(desc(courses.createdAt), desc(courses.id))
    .limit(limit)
    .all();
}

export function countPublishedCourses(db: Db): number {
  const [{ total }] = db
    .select({ total: count(courses.id) })
    .from(courses)
    .where(eq(courses.status, CourseStatus.Published))
    .all();
  return total;
}
