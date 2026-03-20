import { describe, expect, it } from "vitest";
import { readApiBody } from "./response-utils";

describe("readApiBody", () => {
  it("parses JSON API payloads", async () => {
    const res = new Response(JSON.stringify({ message: "ok", data: { id: "a1" } }), {
      headers: { "content-type": "application/json" },
    });

    const parsed = await readApiBody<{ id: string }>(res);

    expect(parsed.message).toBe("ok");
    expect(parsed.data?.id).toBe("a1");
  });

  it("falls back to text for non-JSON error responses", async () => {
    const res = new Response("Internal Server Error", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });

    const parsed = await readApiBody(res);

    expect(parsed.message).toBe("Internal Server Error");
  });
});
