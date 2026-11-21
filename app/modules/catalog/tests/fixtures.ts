import type { TestDb } from "~/test/setup";
import { CourseStatus, UserRole } from "~/db/schema";
import { createAccounts } from "~/modules/accounts/index.server";
import { createCourseAuthoring } from "~/modules/course-authoring/index.server";
import { createCatalog } from "../index.server";

type CourseFixture = {
  categoryId: number;
  status: CourseStatus;
  createdAt?: string;
  title?: string;
};

function addInstructor(db: TestDb) {
  const accounts = createAccounts(db);
  const instructor = accounts.createStudent(
    "Ina Instructor",
    "ina@example.com"
  );
  accounts.changeRole(instructor.id, UserRole.Instructor);
  return instructor.id;
}

/**
 * Builds catalog data through the modules that write it, as the app does: an
 * account promoted to instructor, categories from the catalog, and courses,
 * modules and lessons from course authoring.
 */
export function catalogFixtures(db: TestDb) {
  const authoring = createCourseAuthoring(db);
  const instructorId = addInstructor(db);
  let courseCounter = 0;

  function addCourse({ categoryId, status, createdAt, title }: CourseFixture) {
    courseCounter += 1;
    const now = new Date(createdAt ?? "2026-01-01T00:00:00.000Z");
    const course = authoring.createCourse(
      {
        title: title ?? `Course ${courseCounter}`,
        slug: `course-${courseCounter}`,
        description: "A course",
        salesCopy: "Sales copy",
        instructorId,
        categoryId,
        coverImageUrl: `/covers/${courseCounter}.png`,
      },
      now
    );
    authoring.changeCourseStatus({ courseId: course.id, status, now });
    return { ...course, status };
  }

  return {
    addCategory: (name: string) => createCatalog(db).createCategory(name),
    addCourse,
    addModuleWithLessons(courseId: number, lessonCount: number) {
      const module = authoring.addModule(courseId, "Module");
      for (let n = 1; n <= lessonCount; n += 1) {
        authoring.addLesson(module.id, `Lesson ${n}`);
      }
    },
  };
}
