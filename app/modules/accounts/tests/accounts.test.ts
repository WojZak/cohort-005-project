import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "~/test/setup";
import { UserRole } from "~/db/schema";
import { createAccounts } from "../index.server";

let accounts: ReturnType<typeof createAccounts>;

beforeEach(() => {
  accounts = createAccounts(createTestDb());
});

describe("createStudent", () => {
  it("creates a student with no avatar", () => {
    expect(accounts.createStudent("Sam", "sam@example.com")).toEqual(
      expect.objectContaining({
        name: "Sam",
        email: "sam@example.com",
        role: UserRole.Student,
        avatarUrl: null,
      })
    );
  });
});

describe("changeRole", () => {
  it("gives the user the new role", () => {
    const sam = accounts.createStudent("Sam", "sam@example.com");

    expect(accounts.changeRole(sam.id, UserRole.Instructor)).toEqual(
      expect.objectContaining({ id: sam.id, role: UserRole.Instructor })
    );
  });

  it("returns undefined for a missing user", () => {
    expect(accounts.changeRole(999, UserRole.Admin)).toBeUndefined();
  });
});
