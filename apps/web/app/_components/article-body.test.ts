import { describe, expect, test } from "bun:test";
import { parseBodyJson } from "./article-body";

describe("parseBodyJson", () => {
  test("returns an empty doc for empty input", () => {
    expect(parseBodyJson("")).toEqual({ type: "doc", content: [] });
  });

  test("parses a valid Tiptap doc", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    };
    expect(parseBodyJson(JSON.stringify(doc))).toEqual(doc);
  });

  test("falls back to an empty doc when input is malformed", () => {
    expect(parseBodyJson("{not valid json")).toEqual({
      type: "doc",
      content: [],
    });
  });
});
