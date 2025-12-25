import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";

export async function uploadFile(file: File): Promise<string> {
  try {
    // Generate upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.mutations.generateUploadUrl);

    // Upload file directly to Convex storage
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const { storageId } = await response.json();

    // Store file metadata
    const fileId = await convex.mutation(api.files.mutations.storeFileMetadata, {
      storageId,
      name: file.name,
      contentType: file.type,
      size: file.size,
    });

    // Get file URL
    const fileUrl = await convex.query(api.files.queries.getFileUrl, {
      storageId,
    });

    return fileUrl || "";
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
}
