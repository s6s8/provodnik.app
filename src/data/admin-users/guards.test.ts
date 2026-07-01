import { describe, expect, it } from "vitest";

import {
  canHardDeleteUser,
  evaluateRoleChange,
  evaluateStatusChange,
  isDemoEmail,
  maskEmail,
  maskPhone,
} from "./guards";

describe("isDemoEmail", () => {
  it("treats example.com and provodnik.test as demo domains", () => {
    expect(isDemoEmail("guide.altai@example.com")).toBe(true);
    expect(isDemoEmail("someone@provodnik.test")).toBe(true);
  });

  it("treats real domains (incl. provodnik.app staff) as non-demo", () => {
    expect(isDemoEmail("admin@provodnik.app")).toBe(false);
    expect(isDemoEmail("real.person@gmail.com")).toBe(false);
  });

  it("is case-insensitive and null-safe", () => {
    expect(isDemoEmail("Guide@EXAMPLE.COM")).toBe(true);
    expect(isDemoEmail(null)).toBe(false);
    expect(isDemoEmail(undefined)).toBe(false);
    expect(isDemoEmail("")).toBe(false);
    expect(isDemoEmail("no-at-sign")).toBe(false);
  });
});

describe("canHardDeleteUser", () => {
  it("allows deleting a demo non-admin user", () => {
    expect(canHardDeleteUser({ email: "t@example.com", role: "traveler" })).toEqual({
      ok: true,
    });
    expect(canHardDeleteUser({ email: "g@example.com", role: "guide" })).toEqual({
      ok: true,
    });
  });

  it("never allows deleting a real (non-demo) user", () => {
    const result = canHardDeleteUser({ email: "real@gmail.com", role: "traveler" });
    expect(result.ok).toBe(false);
  });

  it("never allows deleting an admin, even a demo one", () => {
    const result = canHardDeleteUser({ email: "admin@example.com", role: "admin" });
    expect(result.ok).toBe(false);
  });

  it("never allows deleting a user with no email", () => {
    expect(canHardDeleteUser({ email: null, role: "traveler" }).ok).toBe(false);
  });
});

describe("evaluateStatusChange", () => {
  const base = {
    currentStatus: "active" as const,
    nextStatus: "suspended" as const,
    isSelf: false,
    targetRole: "traveler" as const,
    otherActiveAdminCount: 1,
  };

  it("allows suspending an active traveler", () => {
    expect(evaluateStatusChange(base)).toEqual({ ok: true });
  });

  it("blocks acting on your own account", () => {
    expect(evaluateStatusChange({ ...base, isSelf: true }).ok).toBe(false);
  });

  it("blocks a no-op transition", () => {
    expect(
      evaluateStatusChange({ ...base, currentStatus: "suspended" }).ok,
    ).toBe(false);
  });

  it("blocks suspending the last active admin", () => {
    expect(
      evaluateStatusChange({
        ...base,
        targetRole: "admin",
        otherActiveAdminCount: 0,
      }).ok,
    ).toBe(false);
  });

  it("allows suspending an admin when another active admin remains", () => {
    expect(
      evaluateStatusChange({
        ...base,
        targetRole: "admin",
        otherActiveAdminCount: 2,
      }),
    ).toEqual({ ok: true });
  });

  it("allows reactivating the last admin (moving back to active)", () => {
    expect(
      evaluateStatusChange({
        currentStatus: "suspended",
        nextStatus: "active",
        isSelf: false,
        targetRole: "admin",
        otherActiveAdminCount: 0,
      }),
    ).toEqual({ ok: true });
  });
});

describe("evaluateRoleChange", () => {
  const base = {
    isSelf: false,
    currentRole: "guide" as const,
    nextRole: "traveler" as const,
    otherActiveAdminCount: 1,
  };

  it("allows a normal role change", () => {
    expect(evaluateRoleChange(base)).toEqual({ ok: true });
  });

  it("blocks changing your own role", () => {
    expect(evaluateRoleChange({ ...base, isSelf: true }).ok).toBe(false);
  });

  it("blocks a no-op role change", () => {
    expect(
      evaluateRoleChange({ ...base, currentRole: "traveler" }).ok,
    ).toBe(false);
  });

  it("blocks demoting the last active admin", () => {
    expect(
      evaluateRoleChange({
        isSelf: false,
        currentRole: "admin",
        nextRole: "traveler",
        otherActiveAdminCount: 0,
      }).ok,
    ).toBe(false);
  });

  it("allows demoting an admin when another active admin remains", () => {
    expect(
      evaluateRoleChange({
        isSelf: false,
        currentRole: "admin",
        nextRole: "traveler",
        otherActiveAdminCount: 1,
      }),
    ).toEqual({ ok: true });
  });

  it("allows promoting a traveler to admin", () => {
    expect(
      evaluateRoleChange({
        isSelf: false,
        currentRole: "traveler",
        nextRole: "admin",
        otherActiveAdminCount: 1,
      }),
    ).toEqual({ ok: true });
  });
});

describe("maskEmail", () => {
  it("keeps the first local char and the domain", () => {
    expect(maskEmail("alexey@gmail.com")).toBe("a•••@gmail.com");
  });

  it("masks a single-char local part", () => {
    expect(maskEmail("a@x.com")).toBe("•••@x.com");
  });

  it("is null-safe", () => {
    expect(maskEmail(null)).toBe("—");
    expect(maskEmail("not-an-email")).toBe("—");
  });
});

describe("maskPhone", () => {
  it("reveals only the last two digits", () => {
    expect(maskPhone("+7 916 123 45 67")).toBe("··· 67");
  });

  it("is null-safe", () => {
    expect(maskPhone(null)).toBe("—");
    expect(maskPhone("")).toBe("—");
  });
});
