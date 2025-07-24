import { httpClient } from "@/lib/http-client";

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res: any = await httpClient("/files/upload", {
    method: "POST",
    body: formData,
  });

  if (res && res.success && res.file) {
    return res.file.url as string;
  }

  return "";
}
