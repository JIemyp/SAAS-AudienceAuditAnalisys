import { SupabaseClient } from "@supabase/supabase-js";

// Cyrillic to Latin transliteration map
const cyrillicToLatin: Record<string, string> = {
  // Russian
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Ukrainian specific
  і: "i", ї: "yi", є: "ye", ґ: "g",
  // Uppercase Russian
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "Zh",
  З: "Z", И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O",
  П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "Kh", Ц: "Ts",
  Ч: "Ch", Ш: "Sh", Щ: "Shch", Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
  // Uppercase Ukrainian specific
  І: "I", Ї: "Yi", Є: "Ye", Ґ: "G",
};

/**
 * Transliterate a string from Cyrillic to Latin and sanitize for storage
 */
function transliterateFileName(fileName: string): string {
  // Extract extension
  const lastDot = fileName.lastIndexOf(".");
  const name = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.slice(lastDot) : "";

  // Transliterate Cyrillic characters
  let result = "";
  for (const char of name) {
    if (cyrillicToLatin[char] !== undefined) {
      result += cyrillicToLatin[char];
    } else if (/[a-zA-Z0-9_\-.]/.test(char)) {
      result += char;
    } else if (char === " ") {
      result += "_";
    } else {
      // Skip other non-ASCII characters or replace with underscore
      result += "_";
    }
  }

  // Clean up multiple underscores and trim
  result = result.replace(/_+/g, "_").replace(/^_|_$/g, "");

  // Ensure non-empty name
  if (!result) {
    result = "file_" + Date.now();
  }

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  return `${result}_${timestamp}${ext.toLowerCase()}`;
}

export interface UploadedFileResult {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  expiresAt: string;
}

/**
 * Upload files to Supabase Storage and save metadata to project_files table
 */
export async function uploadProjectFiles(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  files: File[]
): Promise<UploadedFileResult[]> {
  const uploadedFiles: UploadedFileResult[] = [];

  for (const file of files) {
    // Transliterate filename to handle Cyrillic and other non-ASCII characters
    const safeFileName = transliterateFileName(file.name);
    // Path format: {userId}/{projectId}/{safeFileName}
    const filePath = `${userId}/${projectId}/${safeFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`Failed to upload ${file.name}:`, uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    // Calculate expiration date (5 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    // Save metadata to project_files table
    const { data: fileRecord, error: dbError } = await supabase
      .from("project_files")
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error(`Failed to save file metadata for ${file.name}:`, dbError);
      // Try to delete the uploaded file
      await supabase.storage.from("project-files").remove([filePath]);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    uploadedFiles.push({
      id: fileRecord.id,
      fileName: fileRecord.file_name,
      filePath: fileRecord.file_path,
      fileSize: fileRecord.file_size,
      expiresAt: fileRecord.expires_at,
    });
  }

  return uploadedFiles;
}

/**
 * Get file content from Supabase Storage
 */
export async function getFileContent(
  supabase: SupabaseClient,
  filePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("project-files")
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return await data.text();
}

/**
 * Delete project files from storage and database
 */
export async function deleteProjectFiles(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  // Get all files for this project
  const { data: files, error: fetchError } = await supabase
    .from("project_files")
    .select("file_path")
    .eq("project_id", projectId);

  if (fetchError) {
    throw new Error(`Failed to fetch files: ${fetchError.message}`);
  }

  if (files && files.length > 0) {
    // Delete from storage
    const paths = files.map((f) => f.file_path);
    const { error: storageError } = await supabase.storage
      .from("project-files")
      .remove(paths);

    if (storageError) {
      console.error("Failed to delete files from storage:", storageError);
    }

    // Delete from database (will cascade from project deletion anyway)
    const { error: dbError } = await supabase
      .from("project_files")
      .delete()
      .eq("project_id", projectId);

    if (dbError) {
      console.error("Failed to delete file records:", dbError);
    }
  }
}
