import { describe, expect, it } from "vitest";

import {
  isHoneypotTriggered,
  sanitizeEmail,
  sanitizePayload,
} from "@/lib/security/sanitize";

describe("sanitize security helpers", () => {
  it("limpia tags y caracteres de control", () => {
    const payload = sanitizePayload<{ message: string }>({
      message: "<script>alert(1)</script> Hola\u0000",
    });

    expect(payload.message).toBe("alert(1) Hola");
  });

  it("valida email seguro", () => {
    expect(sanitizeEmail("USER@Example.COM")).toBe("user@example.com");
    expect(sanitizeEmail("invalid-email")).toBe("");
  });

  it("detecta honeypot", () => {
    expect(isHoneypotTriggered({ website: "bot-value" })).toBe(true);
    expect(isHoneypotTriggered({ website: "" })).toBe(false);
  });
});
