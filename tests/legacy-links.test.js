import { describe, expect, it } from "vitest";
import { cleanLegacyUrl } from "../js/legacyLinks.js";

describe("retired recruiter links", () => {
  const base = "https://rvs23.dev";

  it("strips #recruiter and ?mode=recruiter", () => {
    expect(cleanLegacyUrl(`${base}/#recruiter`)).toBe("/");
    expect(cleanLegacyUrl(`${base}/?mode=recruiter`)).toBe("/");
    expect(cleanLegacyUrl(`${base}/?mode=recruiter#recruiter`)).toBe("/");
  });

  it("keeps unrelated params", () => {
    expect(cleanLegacyUrl(`${base}/?mode=recruiter&cmd=skills`)).toBe("/?cmd=skills");
  });

  it("leaves ordinary URLs alone", () => {
    expect(cleanLegacyUrl(`${base}/`)).toBeNull();
    expect(cleanLegacyUrl(`${base}/?cmd=rain#top`)).toBeNull();
    expect(cleanLegacyUrl(`${base}/?mode=other`)).toBeNull();
  });
});
