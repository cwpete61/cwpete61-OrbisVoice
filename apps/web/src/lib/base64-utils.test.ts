import { describe, expect, it } from "vitest";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64-utils";

describe("base64-utils", () => {
  it("round-trips binary audio payloads", () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 200, 255]);
    const encoded = arrayBufferToBase64(bytes.buffer);
    const decoded = new Uint8Array(base64ToArrayBuffer(encoded));

    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});
