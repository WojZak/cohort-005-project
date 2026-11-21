import type { UserRole } from "~/db/schema";
import { db } from "~/db";
import { changeRole, createStudent, type Db } from "./lib/accounts";

/**
 * Writing user accounts, bound to a database. The app uses `accounts`; tests
 * build their own against a test database.
 */
export function createAccounts(database: Db) {
  return {
    /** A new user with the student role. */
    createStudent(name: string, email: string) {
      return createStudent(database, name, email);
    },

    /** Gives a user `role`. Returns undefined when there is no such user. */
    changeRole(userId: number, role: UserRole) {
      return changeRole(database, userId, role);
    },
  };
}

// Pure so a route importing this only for its action doesn't pull the
// database into the client bundle (see `~/db`).
export const accounts = /* @__PURE__ */ createAccounts(db);
