"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type FileError, type FileRejection, useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Types
 */
interface FileWithPreview extends File {
  preview?: string;
  errors: readonly FileError[];
}

type UseSupabaseUploadOptions = {
  bucketName: string;
  path?: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  cacheControl?: number;
  upsert?: boolean;
};

export type UploadedFileInfo = {
  name: string;
  path: string;
  publicUrl: string;
};

type UseSupabaseUploadReturn = {
  files: FileWithPreview[];
  setFiles: (files: FileWithPreview[]) => void;
  successes: string[]; // filenames
  isSuccess: boolean;
  loading: boolean;
  errors: { name: string; message: string }[];
  onUpload: () => Promise<UploadedFileInfo[]>;
  maxFileSize: number;
  maxFiles: number;
  allowedMimeTypes: string[];
  // dropzone props
  getRootProps: any;
  getInputProps: any;
  open: () => void;
  // extras
  uploadedFiles: UploadedFileInfo[]; // latest uploaded files with publicUrl
  removeUploadedFile: (path: string) => Promise<boolean>;
};

/**
 * Hook
 */
export const useSupabaseUpload = (options: UseSupabaseUploadOptions): UseSupabaseUploadReturn => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) {
      return false;
    }
    if (errors.length === 0 && successes.length === files.length) {
      return true;
    }
    return false;
  }, [errors.length, successes.length, files.length]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          (file as FileWithPreview).preview = URL.createObjectURL(file);
          (file as FileWithPreview).errors = [];
          return file as FileWithPreview;
        });

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        (file as FileWithPreview).preview = URL.createObjectURL(file);
        (file as FileWithPreview).errors = errors;
        return file as FileWithPreview;
      });

      const newFiles = [...files, ...validFiles, ...invalidFiles];

      setFiles(newFiles);
    },
    [files, setFiles]
  );

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.length
      ? allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
      : undefined,
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  });

  const onUpload = useCallback(async (): Promise<UploadedFileInfo[]> => {
    if (!supabase) {
      const msg = "Supabase client no configurado.";
      setErrors([{ name: "client", message: msg }]);
      throw new Error(msg);
    }

    setLoading(true);

    // Retry/upload logic: upload files that haven't succeeded
    const filesToUpload = files.filter((f) => !successes.includes(f.name));

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        try {
          const filenameSafe = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
          const destPath = path ? `${path}/${filenameSafe}` : filenameSafe;

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(destPath, file, {
              cacheControl: String(cacheControl),
              upsert,
              contentType: file.type,
            });

          if (uploadError) {
            return { name: file.name, path: destPath, publicUrl: undefined, error: uploadError.message };
          }

          // get public url immediately
          const { data: publicData } = await supabase.storage.from(bucketName).getPublicUrl(destPath);

          const publicUrl = publicData?.publicUrl ?? "";
          if (!publicUrl) {
            return { name: file.name, path: destPath, publicUrl: "", error: "Failed to get public URL" };
          }

          return { name: file.name, path: destPath, publicUrl, error: undefined as any };
        } catch (err: any) {
          return { name: file.name, path: "", publicUrl: undefined, error: err?.message ?? String(err) };
        }
      })
    );

    // collect results
    const errorResults = responses.filter((r: any) => r.error);
    const successResults = responses.filter((r: any) => !r.error && r.publicUrl);

    // update errors and successes (filenames)
    setErrors(errorResults.map((e: any) => ({ name: e.name, message: e.error })));
    setSuccesses((prev) => Array.from(new Set([...prev, ...successResults.map((s: any) => s.name)])));

    // update uploadedFiles with path + publicUrl
    const newlyUploaded: UploadedFileInfo[] = successResults.map((s: any) => ({
      name: s.name,
      path: s.path,
      publicUrl: s.publicUrl,
    }));

    setUploadedFiles((prev) => {
      // merge unique by path
      const map = new Map<string, UploadedFileInfo>(prev.map((p) => [p.path, p]));
      for (const u of newlyUploaded) map.set(u.path, u);
      return Array.from(map.values());
    });

    setLoading(false);

    return newlyUploaded;
  }, [files, successes, bucketName, path, cacheControl, upsert]);

  const removeUploadedFile = useCallback(
    async (filePath: string) => {
      if (!supabase) {
        setErrors([{ name: "client", message: "Supabase client no configurado." }]);
        return false;
      }
      try {
        const { error } = await supabase.storage.from(bucketName).remove([filePath]);
        if (error) {
          setErrors((prev) => [...prev, { name: filePath, message: error.message }]);
          return false;
        }
        // remove from uploadedFiles
        setUploadedFiles((prev) => prev.filter((u) => u.path !== filePath));
        return true;
      } catch (err: any) {
        setErrors((prev) => [...prev, { name: filePath, message: err?.message ?? String(err) }]);
        return false;
      }
    },
    [bucketName]
  );

  useEffect(() => {
    if (files.length === 0) {
      setErrors([]);
    }

    // If files <= maxFiles remove too-many-files errors
    if (files.length <= maxFiles) {
      let changed = false;
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === "too-many-files")) {
          file.errors = file.errors.filter((e) => e.code !== "too-many-files");
          changed = true;
        }
        return file;
      });
      if (changed) {
        setFiles(newFiles);
      }
    }
  }, [files.length, setFiles, maxFiles]);

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
    uploadedFiles,
    removeUploadedFile,
  } as UseSupabaseUploadReturn;
};