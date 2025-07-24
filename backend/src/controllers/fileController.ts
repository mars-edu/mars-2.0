import { Hono, Context } from "hono";
import FileService from "../services/fileService.js";
import type { Env } from "../types/env.js";

const files = new Hono<{ Bindings: Env }>();

files.post("/upload", async (c: Context<{ Bindings: Env }>) => {
  const form = await c.req.formData();
  const upload = form.get("file");
  if (!upload || !(upload instanceof File)) {
    return c.json({ success: false, message: "File is required" }, 400);
  }
  const service = new FileService(c);
  const record = await service.upload(upload);
  return c.json({ success: true, file: record }, 201);
});

export default files;
