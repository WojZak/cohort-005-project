import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createCatalog } from "../index.server";
import { CATALOG_PAGE_SIZE } from "../index";

let db: TestDb;
let instructorId: number;
let categoryId: number;

beforeEach(() => {
  db = createTestDb();
  instructorId = db
    .insert(schema.users)
    .values({
      name: "Ina Instructor",
      email: "ina@example.com",
      role: UserRole.Instructor,
    })
    .returning()
    .get().id;
  categoryId = db
    .insert(schema.categories)
    .values({ name: "Web Development", slug: "web-development" })
    .returning()
    .get().id;
});

// ─── Fixtures ───
// Courses, modules and lessons are written by instructor routes, not by a
// module yet, so rows go in directly. Kept here so a schema change touches
// only this block.

let slugCounter = 0;

function addCourse(
  status: CourseStatus,
  createdAt: string,
  title = `Course ${slugCounter + 1}`
) {
  slugCounter += 1;
  return db
    .insert(schema.courses)
    .values({
      title,
      slug: `course-${slugCounter}`,
      description: "A course",
      salesCopy: markdown("Sales copy"),
      instructorId,
      categoryId,
      status,
      coverImageUrl: `/covers/${slugCounter}.png`,
      createdAt,
    })
    .returning()
    .get();
}

function addModuleWithLessons(courseId: number, lessonCount: number) {
  const moduleId = db
    .insert(schema.modules)
    .values({ courseId, title: "Module", position: 1 })
    .returning()
    .get().id;
  for (let position = 1; position <= lessonCount; position += 1) {
    db.insert(schema.lessons)
      .values({ moduleId, title: `Lesson ${position}`, position })
      .run();
  }
}

describe("listFeaturedCourses", () => {
  it("returns published courses, newest first, with instructor and category", () => {
    addCourse(CourseStatus.Published, "2026-01-01T00:00:00.000Z", "Older");
    const newer = addCourse(
      CourseStatus.Published,
      "2026-02-01T00:00:00.000Z",
      "Newer"
    );

    const featured = createCatalog(db).listFeaturedCourses(3);

    expect(featured.map((c) => c.title)).toEqual(["Newer", "Older"]);
    expect(featured[0]).toEqual({
      id: newer.id,
      title: "Newer",
      slug: newer.slug,
      description: "A course",
      coverImageUrl: newer.coverImageUrl,
      instructorName: "Ina Instructor",
      categoryName: "Web Development",
      lessonCount: 0,
    });
  });

  it("leaves out draft and archived courses", () => {
    addCourse(CourseStatus.Draft, "2026-03-01T00:00:00.000Z", "Draft");
    addCourse(CourseStatus.Archived, "2026-03-02T00:00:00.000Z", "Archived");
    addCourse(CourseStatus.Published, "2026-01-01T00:00:00.000Z", "Live");

    expect(
      createCatalog(db)
        .listFeaturedCourses(3)
        .map((c) => c.title)
    ).toEqual(["Live"]);
  });

  it("stops at the limit", () => {
    addCourse(CourseStatus.Published, "2026-01-01T00:00:00.000Z", "A");
    addCourse(CourseStatus.Published, "2026-01-02T00:00:00.000Z", "B");
    addCourse(CourseStatus.Published, "2026-01-03T00:00:00.000Z", "C");

    expect(
      createCatalog(db)
        .listFeaturedCourses(2)
        .map((c) => c.title)
    ).toEqual(["C", "B"]);
  });

  it("counts lessons across every module of each course", () => {
    const big = addCourse(
      CourseStatus.Published,
      "2026-01-02T00:00:00.000Z",
      "Big"
    );
    addModuleWithLessons(big.id, 3);
    addModuleWithLessons(big.id, 2);
    const small = addCourse(
      CourseStatus.Published,
      "2026-01-01T00:00:00.000Z",
      "Small"
    );
    addModuleWithLessons(small.id, 1);

    expect(
      createCatalog(db)
        .listFeaturedCourses(3)
        .map((c) => [c.title, c.lessonCount])
    ).toEqual([
      ["Big", 5],
      ["Small", 1],
    ]);
  });

  it("returns nothing when no course is published", () => {
    addCourse(CourseStatus.Draft, "2026-01-01T00:00:00.000Z");

    expect(createCatalog(db).listFeaturedCourses(3)).toEqual([]);
  });
});

describe("countCatalogPageCourses", () => {
  it("counts only published courses", () => {
    addCourse(CourseStatus.Published, "2026-01-01T00:00:00.000Z");
    addCourse(CourseStatus.Published, "2026-01-02T00:00:00.000Z");
    addCourse(CourseStatus.Draft, "2026-01-03T00:00:00.000Z");
    addCourse(CourseStatus.Archived, "2026-01-04T00:00:00.000Z");

    expect(createCatalog(db).countCatalogPageCourses()).toBe(2);
  });

  it("caps at the catalog page size, as the catalog page does", () => {
    for (let i = 0; i <= CATALOG_PAGE_SIZE; i += 1) {
      addCourse(CourseStatus.Published, "2026-01-01T00:00:00.000Z");
    }

    expect(createCatalog(db).countCatalogPageCourses()).toBe(CATALOG_PAGE_SIZE);
  });

  it("is zero with no courses", () => {
    expect(createCatalog(db).countCatalogPageCourses()).toBe(0);
  });
});
