import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createCatalog } from "../index.server";
import { catalogUrlForCategory } from "../index";

let db: TestDb;
let instructorId: number;

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
});

// ─── Fixtures ───
// Categories and courses are written by admin and instructor routes, not by a
// module yet, so rows go in directly. Kept here so a schema change touches
// only this block.

function addCategory(name: string) {
  return db
    .insert(schema.categories)
    .values({ name, slug: name.toLowerCase().replaceAll(" ", "-") })
    .returning()
    .get();
}

let slugCounter = 0;

function addCourse(categoryId: number, status: CourseStatus) {
  slugCounter += 1;
  return db
    .insert(schema.courses)
    .values({
      title: `Course ${slugCounter}`,
      slug: `course-${slugCounter}`,
      description: "A course",
      salesCopy: markdown("Sales copy"),
      instructorId,
      categoryId,
      status,
    })
    .returning()
    .get();
}

describe("listBrowsableCategories", () => {
  it("lists each category with its published course count, by name", () => {
    const web = addCategory("Web Development");
    const data = addCategory("Data Science");
    addCourse(web.id, CourseStatus.Published);
    addCourse(web.id, CourseStatus.Published);
    addCourse(data.id, CourseStatus.Published);

    expect(createCatalog(db).listBrowsableCategories()).toEqual([
      {
        id: data.id,
        name: "Data Science",
        slug: "data-science",
        courseCount: 1,
      },
      {
        id: web.id,
        name: "Web Development",
        slug: "web-development",
        courseCount: 2,
      },
    ]);
  });

  it("does not count draft or archived courses", () => {
    const web = addCategory("Web Development");
    addCourse(web.id, CourseStatus.Published);
    addCourse(web.id, CourseStatus.Draft);
    addCourse(web.id, CourseStatus.Archived);

    expect(createCatalog(db).listBrowsableCategories()).toEqual([
      expect.objectContaining({ slug: "web-development", courseCount: 1 }),
    ]);
  });

  it("leaves out categories with no published course", () => {
    addCategory("Empty");
    const drafts = addCategory("Only Drafts");
    addCourse(drafts.id, CourseStatus.Draft);
    const live = addCategory("Live");
    addCourse(live.id, CourseStatus.Published);

    expect(
      createCatalog(db)
        .listBrowsableCategories()
        .map((c) => c.slug)
    ).toEqual(["live"]);
  });

  it("returns nothing when there are no categories", () => {
    expect(createCatalog(db).listBrowsableCategories()).toEqual([]);
  });
});

describe("catalogUrlForCategory", () => {
  it("links to the catalog filtered by the category", () => {
    expect(catalogUrlForCategory("web-development")).toBe(
      "/courses?category=web-development"
    );
  });

  it("encodes the slug", () => {
    expect(catalogUrlForCategory("c++ & go")).toBe(
      "/courses?category=c%2B%2B+%26+go"
    );
  });
});
