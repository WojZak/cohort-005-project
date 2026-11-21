import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type TestDb } from "~/test/setup";
import { CourseStatus, UserRole } from "~/db/schema";
import { createAccounts } from "~/modules/accounts/index.server";
import { createCatalog } from "~/modules/catalog/index.server";
import { createCourseAuthoring, type NewCourse } from "../index.server";

let authoring: ReturnType<typeof createCourseAuthoring>;
let draft: NewCourse;

const MONDAY = new Date("2026-03-02T09:00:00.000Z");
const TUESDAY = new Date("2026-03-03T09:00:00.000Z");

beforeEach(() => {
  const db: TestDb = createTestDb();
  authoring = createCourseAuthoring(db);
  const accounts = createAccounts(db);
  const instructor = accounts.createStudent("Ina", "ina@example.com");
  accounts.changeRole(instructor.id, UserRole.Instructor);
  draft = {
    title: "Intro",
    slug: "intro",
    description: "A course",
    salesCopy: "Buy it",
    instructorId: instructor.id,
    categoryId: createCatalog(db).createCategory("Web").id,
    coverImageUrl: null,
  };
});

describe("createCourse", () => {
  it("creates a draft stamped with the given time", () => {
    expect(authoring.createCourse(draft, MONDAY)).toEqual(
      expect.objectContaining({
        title: "Intro",
        slug: "intro",
        salesCopy: "Buy it",
        status: CourseStatus.Draft,
        createdAt: MONDAY.toISOString(),
        updatedAt: MONDAY.toISOString(),
      })
    );
  });

  it("refuses blank sales copy", () => {
    expect(() =>
      authoring.createCourse({ ...draft, salesCopy: "  " }, MONDAY)
    ).toThrow("Sales copy cannot be empty");
  });
});

describe("changeCourseStatus", () => {
  it("sets the status and stamps updatedAt, leaving createdAt", () => {
    const course = authoring.createCourse(draft, MONDAY);

    expect(
      authoring.changeCourseStatus({
        courseId: course.id,
        status: CourseStatus.Published,
        now: TUESDAY,
      })
    ).toEqual(
      expect.objectContaining({
        status: CourseStatus.Published,
        createdAt: MONDAY.toISOString(),
        updatedAt: TUESDAY.toISOString(),
      })
    );
  });

  it("returns undefined for a missing course", () => {
    expect(
      authoring.changeCourseStatus({
        courseId: 999,
        status: CourseStatus.Published,
        now: TUESDAY,
      })
    ).toBeUndefined();
  });
});

describe("addModule", () => {
  it("puts each new module after the course's last", () => {
    const course = authoring.createCourse(draft, MONDAY);
    const other = authoring.createCourse({ ...draft, slug: "other" }, MONDAY);
    authoring.addModule(other.id, "Elsewhere");

    const first = authoring.addModule(course.id, "First");
    const second = authoring.addModule(course.id, "Second");

    expect([first, second].map((m) => [m.title, m.position])).toEqual([
      ["First", 1],
      ["Second", 2],
    ]);
  });
});

describe("addLesson", () => {
  it("puts each new lesson after the module's last, with no content", () => {
    const course = authoring.createCourse(draft, MONDAY);
    const module = authoring.addModule(course.id, "Module");
    const other = authoring.addModule(course.id, "Other");
    authoring.addLesson(other.id, "Elsewhere");

    const first = authoring.addLesson(module.id, "First");
    const second = authoring.addLesson(module.id, "Second");

    expect(first).toEqual(
      expect.objectContaining({
        moduleId: module.id,
        title: "First",
        position: 1,
        content: null,
        videoUrl: null,
        durationMinutes: null,
      })
    );
    expect(second.position).toBe(2);
  });
});
