import { describe, expect, it } from "vitest";
import { pickWorkspacePrimaryUser } from "./workspace-management";

describe("pickWorkspacePrimaryUser", () => {
  it("prefers system admin users for workspace display", () => {
    const user = pickWorkspacePrimaryUser([
      { email: "old-user@example.com", name: "Old User", isAdmin: false, role: "USER" },
      {
        email: "admin@orbisvoice.app",
        name: "System Admin Agent",
        isAdmin: true,
        role: "SYSTEM_ADMIN",
      },
    ]);

    expect(user?.email).toBe("admin@orbisvoice.app");
  });

  it("falls back to first user when no admin exists", () => {
    const user = pickWorkspacePrimaryUser([
      { email: "first@example.com", name: "First", isAdmin: false, role: "USER" },
      { email: "second@example.com", name: "Second", isAdmin: false, role: "USER" },
    ]);

    expect(user?.email).toBe("first@example.com");
  });
});
