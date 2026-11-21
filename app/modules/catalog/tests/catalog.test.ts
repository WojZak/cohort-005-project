import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import { CourseStatus } from "~/db/schema";
import { createCatalog } from "../index.server";
import { catalogUrlForCategory } from "../index";
import { catalogFixtures } from "./fixtures";

let db: TestDb;
let fixtures: ReturnType<typeof catalogFixtures>;

beforeEach(() => {
  db = createTestDb();
  fixtures = catalogFixtures(db);
});

function addCategory(name: string) {
  return fixtures.addCategory(name);
}

function addCourse(categoryId: number, status: CourseStatus) {
  return fixtures.addCourse({ categoryId, status });
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

describe("createCategory", () => {
  it("derives the slug from the name", () => {
    expect(createCatalog(db).createCategory("C++ & Go!")).toEqual(
      expect.objectContaining({ name: "C++ & Go!", slug: "c-go" })
    );
  });

  it("refuses a name that is taken", () => {
    addCategory("Web");

    expect(() => createCatalog(db).createCategory("Web")).toThrow(
      'A category with the name "Web" already exists.'
    );
  });

  it("refuses a name whose slug is taken", () => {
    addCategory("Web Dev");

    expect(() => createCatalog(db).createCategory("web dev")).toThrow(
      'A category with the slug "web-dev" already exists.'
    );
  });
});

describe("renameCategory", () => {
  it("renames the category and re-derives its slug", () => {
    const web = addCategory("Web");

    expect(createCatalog(db).renameCategory(web.id, "Web Dev")).toEqual({
      id: web.id,
      name: "Web Dev",
      slug: "web-dev",
    });
  });

  it("keeps the category's own name", () => {
    const web = addCategory("Web");

    expect(createCatalog(db).renameCategory(web.id, "Web")).toEqual(
      expect.objectContaining({ slug: "web" })
    );
  });

  it("refuses a name another category holds", () => {
    addCategory("Web");
    const data = addCategory("Data");

    expect(() => createCatalog(db).renameCategory(data.id, "Web")).toThrow(
      'A category with the name "Web" already exists.'
    );
  });

  it("refuses a slug another category holds", () => {
    addCategory("Web Dev");
    const data = addCategory("Data");

    expect(() => createCatalog(db).renameCategory(data.id, "web dev")).toThrow(
      'A category with the slug "web-dev" already exists.'
    );
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
