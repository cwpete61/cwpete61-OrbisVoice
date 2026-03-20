import { promises as fs } from "fs";
import path from "path";

export async function GET(): Promise<Response> {
  try {
    const filePath = path.join(process.cwd(), "phase-status.md");
    const content = await fs.readFile(filePath, "utf8");

    return Response.json({
      content,
      filePath,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to read phase-status.md", error);

    return Response.json(
      {
        error: "Could not read phase-status.md",
      },
      { status: 500 },
    );
  }
}