import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createCatalog } from "../index.server";
import { catalogUrlForCategory } from "../index";

let db: TestDb;
let catalog: ReturnType<typeof createCatalog>;
let instructorId: number;

beforeEach(() => {
  db = createTestDb();
  catalog = createCatalog(db);
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
// Courses are written by several instructor and admin routes and no module
// owns that write yet, so they go in directly. Categories go in through the
// catalog, which owns them.

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

describe("listCategories", () => {
  it("returns nothing when there are no categories", () => {
    expect(catalog.listCategories()).toEqual([]);
  });

  it("lists every category by name, with its slug", () => {
    const web = catalog.createCategory("Web Development");
    const data = catalog.createCategory("Data Science");
    addCourse(web.id, CourseStatus.Published);
    addCourse(data.id, CourseStatus.Published);

    expect(catalog.listCategories()).toEqual([
      {
        id: data.id,
        name: "Data Science",
        slug: "data-science",
        hasPublishedCourse: true,
      },
      {
        id: web.id,
        name: "Web Development",
        slug: "web-development",
        hasPublishedCourse: true,
      },
    ]);
  });

  it("lists a category once however many courses it has", () => {
    const web = catalog.createCategory("Web");
    addCourse(web.id, CourseStatus.Published);
    addCourse(web.id, CourseStatus.Published);
    addCourse(web.id, CourseStatus.Draft);

    expect(catalog.listCategories()).toHaveLength(1);
  });

  it("keeps a category with no published course, marked as such", () => {
    catalog.createCategory("Empty");
    const drafts = catalog.createCategory("Only Drafts");
    addCourse(drafts.id, CourseStatus.Draft);
    const archived = catalog.createCategory("Only Archived");
    addCourse(archived.id, CourseStatus.Archived);
    const live = catalog.createCategory("Live");
    addCourse(live.id, CourseStatus.Published);

    expect(
      catalog
        .listCategories()
        .map((c) => [c.slug, c.hasPublishedCourse] as const)
    ).toEqual([
      ["empty", false],
      ["live", true],
      ["only-archived", false],
      ["only-drafts", false],
    ]);
  });
});

describe("createCategory", () => {
  it("derives the slug from the name", () => {
    const category = catalog.createCategory("  C++ & Rust!  ");
    expect(category).toMatchObject({
      name: "  C++ & Rust!  ",
      slug: "c-rust",
    });
  });

  it("rejects a name that is already taken", () => {
    catalog.createCategory("Design");
    expect(() => catalog.createCategory("Design")).toThrow(
      'A category with the name "Design" already exists.'
    );
  });

  it("rejects a different name that gives a taken slug", () => {
    catalog.createCategory("Data Science");
    expect(() => catalog.createCategory("Data-Science")).toThrow(
      'A category with the slug "data-science" already exists.'
    );
    expect(catalog.listCategories()).toHaveLength(1);
  });
});

describe("renameCategory", () => {
  it("renames the category and re-derives its slug", () => {
    const category = catalog.createCategory("Web");
    const renamed = catalog.renameCategory(category.id, "Web Development");

    expect(renamed).toEqual({
      id: category.id,
      name: "Web Development",
      slug: "web-development",
    });
    expect(catalog.listCategories().map((c) => c.slug)).toEqual([
      "web-development",
    ]);
  });

  it("lets a category keep its own name and slug", () => {
    const category = catalog.createCategory("Web");
    expect(catalog.renameCategory(category.id, "Web")).toMatchObject({
      name: "Web",
      slug: "web",
    });
  });

  it("rejects another category's name", () => {
    catalog.createCategory("Design");
    const web = catalog.createCategory("Web");
    expect(() => catalog.renameCategory(web.id, "Design")).toThrow(
      'A category with the name "Design" already exists.'
    );
  });

  it("rejects a name that gives another category's slug", () => {
    catalog.createCategory("Data Science");
    const web = catalog.createCategory("Web");
    expect(() => catalog.renameCategory(web.id, "Data-Science")).toThrow(
      'A category with the slug "data-science" already exists.'
    );
    expect(catalog.listCategories().map((c) => c.name)).toEqual([
      "Data Science",
      "Web",
    ]);
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
