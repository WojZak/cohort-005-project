import { db } from "~/db";
import {
  addLesson,
  addModule,
  changeCourseStatus,
  createCourse,
  type Db,
  type NewCourse,
  type StatusChange,
} from "./lib/authoring";

export type { NewCourse, StatusChange } from "./lib/authoring";

/**
 * Writing courses, their modules and their lessons, bound to a database. The
 * app uses `courseAuthoring`; tests build their own against a test database.
 */
export function createCourseAuthoring(database: Db) {
  return {
    /** A new draft course. Throws when the sales copy is blank. */
    createCourse(course: NewCourse, now: Date) {
      return createCourse(database, course, now);
    },

    /** Moves a course to `status`, stamping `updatedAt` with `now`. */
    changeCourseStatus(change: StatusChange) {
      return changeCourseStatus(database, change);
    },

    /** A new module at the end of the course. */
    addModule(courseId: number, title: string) {
      return addModule(database, courseId, title);
    },

    /** A new lesson, with no content yet, at the end of the module. */
    addLesson(moduleId: number, title: string) {
      return addLesson(database, moduleId, title);
    },
  };
}

// Pure so a route importing this only for its action doesn't pull the
// database into the client bundle (see `~/db`).
export const courseAuthoring = /* @__PURE__ */ createCourseAuthoring(db);
