import { describe, expect, it } from "vitest";
import {
  MARKETING_PRIVACY_URL,
  MARKETING_TERMS_URL,
} from "@/lib/marketing-links";

describe("marketing legal links", () => {
  it("points terms and privacy at the marketing site", () => {
    expect(MARKETING_TERMS_URL).toMatch(/^https:\/\/.+/);
    expect(MARKETING_PRIVACY_URL).toMatch(/^https:\/\/.+/);
    expect(MARKETING_TERMS_URL).toContain("/terms");
    expect(MARKETING_PRIVACY_URL).toContain("/privacy");
  });
});
