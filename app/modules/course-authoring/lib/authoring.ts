import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import type * as schema from "~/db/schema";
import { courses, CourseStatus, lessons, modules } from "~/db/schema";
import { markdown } from "~/lib/text";

export type Db = BetterSQLite3Database<typeof schema>;

export type NewCourse = {
  title: string;
  slug: string;
  description: string;
  salesCopy: string;
  instructorId: number;
  categoryId: number;
  coverImageUrl: string | null;
};

export function createCourse(db: Db, course: NewCourse, now: Date) {
  if (course.salesCopy.trim().length === 0) {
    throw new Error("Sales copy cannot be empty");
  }

  const timestamp = now.toISOString();
  return db
    .insert(courses)
    .values({
      ...course,
      salesCopy: markdown(course.salesCopy),
      status: CourseStatus.Draft,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
    .get();
}

export type StatusChange = {
  courseId: number;
  status: CourseStatus;
  now: Date;
};

export function changeCourseStatus(
  db: Db,
  { courseId, status, now }: StatusChange
) {
  return db
    .update(courses)
    .set({ status, updatedAt: now.toISOString() })
    .where(eq(courses.id, courseId))
    .returning()
    .get();
}

// A new module or lesson goes after the last one, so the instructor sees it
// where they expect it: at the bottom of the list they added it to.
export function addModule(db: Db, courseId: number, title: string) {
  const [{ max }] = db
    .select({ max: sql<number>`coalesce(max(${modules.position}), 0)` })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .all();

  return db
    .insert(modules)
    .values({ courseId, title, position: max + 1 })
    .returning()
    .get();
}

export function addLesson(db: Db, moduleId: number, title: string) {
  const [{ max }] = db
    .select({ max: sql<number>`coalesce(max(${lessons.position}), 0)` })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
    .all();

  return db
    .insert(lessons)
    .values({ moduleId, title, position: max + 1 })
    .returning()
    .get();
}
