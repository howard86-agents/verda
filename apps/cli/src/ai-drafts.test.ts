import { describe, expect, test } from "bun:test";
import {
  buildDraft,
  parseDraftArgs,
  serializeTipTapBody,
  slugifyTitle,
} from "./ai-drafts";

describe("AI CMS draft generator", () => {
  test("parseDraftArgs keeps generation draft-only by default", () => {
    const args = parseDraftArgs([
      "--count",
      "3",
      "--section",
      "nutrition",
      "--reference-url",
      "https://www.twreporter.org/",
      "--dry-run",
    ]);

    expect(args.count).toBe(3);
    expect(args.section).toBe("nutrition");
    expect(args.referenceUrl).toBe("https://www.twreporter.org/");
    expect(args.dryRun).toBe(true);
    expect(args.status).toBe("draft");
  });

  test("parseDraftArgs validates references before writing", () => {
    expect(() =>
      parseDraftArgs(["--reference-url", "file:///tmp/source"])
    ).toThrow("http or https");
    expect(() =>
      parseDraftArgs(["--reference-title", "x".repeat(141)])
    ).toThrow("140 characters or fewer");
  });

  test("slugifyTitle creates stable URL-safe slugs", () => {
    expect(slugifyTitle("Urban Soil: A Field Guide for Small Balconies")).toBe(
      "urban-soil-a-field-guide-for-small-balconies"
    );
  });

  test("serializeTipTapBody creates paragraph body JSON", () => {
    const json = serializeTipTapBody(["First paragraph.", "Second paragraph."]);
    expect(JSON.parse(json)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph." }],
        },
      ],
    });
  });

  test("buildDraft returns original CMS-ready draft metadata", () => {
    const draft = buildDraft({
      index: 0,
      sectionId: "earth-garden",
      referenceTitle: "【鼠患10問】城市防鼠大作戰",
      referenceUrl: "https://www.twreporter.org/a/example",
      theme: "urban ecology",
    });

    expect(draft.status).toBe("draft");
    expect(draft.section).toBe("earth-garden");
    expect(draft.cat).toBe("Earth & Garden");
    expect(draft.author).toBe("Verda AI Desk");
    expect(draft.sourceUrl).toBe("https://www.twreporter.org/a/example");
    expect(draft.license).toContain("AI-generated");
    expect(draft.title).not.toContain("鼠患10問");
    expect(draft.bodyJson).not.toContain("鼠患10問");
    expect(JSON.parse(draft.bodyJson).type).toBe("doc");
  });
});
