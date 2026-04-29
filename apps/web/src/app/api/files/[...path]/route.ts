import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/server/auth";

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const [orgId, ...fileParts] = params.path;
  const fileName = fileParts.join("/");

  // Ensure user can only access their own org's files
  if (session.user.orgId !== orgId && session.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), "uploads", orgId, fileName);
    const data = await readFile(filePath);
    
    // Basic mime-type guessing
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";

    return new Response(data, {
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return new Response("Not Found", { status: 404 });
  }
}
