"use client";

import React, { useEffect } from "react";
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CircleAlertIcon, FileIcon, PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface FileUploadCompactProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export function FileUploadCompact({
  maxFiles = 3,
  maxSize = 2 * 1024 * 1024,
  accept = "image/*",
  multiple = true,
  className,
  onFilesChange,
}: FileUploadCompactProps) {
  // 1. شيلنا أي تمرير للـ onFilesChange للـ Hook الداخلي عشان نمنع الـ Loop نهائياً
  const [
    { files, isDragging, errors },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
  });

  // 2. تحديث الـ Parent بيتم هنا وبس، وبنحط شرط آمن يمنع التحديث أثناء الـ Unmount/Redirect
  useEffect(() => {
    let active = true;

    if (active && onFilesChange) {
      onFilesChange(files);
    }

    return () => {
      active = false;
    };
  }, [files, onFilesChange]);

  const isImage = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    return type.startsWith("image/");
  };

  const t = useTranslations();
  return (
    <div className={cn("w-full max-w-lg", className)}>
      <div
        className={cn(
          "border-border rounded-lg flex items-center gap-3 border border-dashed p-4 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} className="sr-only" />

        <Button
          onClick={openFileDialog}
          size="sm"
          className={cn(isDragging && "animate-bounce")}
        >
          <PlusIcon className="h-4 w-4" />
          {t("buttons.upload_file")}
        </Button>

        <div className="flex flex-1 items-center gap-2">
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("messages.file_upload.drag_files")}
            </p>
          ) : (
            files.map((fileItem) => (
              <div key={fileItem.id} className="group/item relative shrink-0">
                {isImage(fileItem.file) && fileItem.preview ? (
                  <Image
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    width={20}
                    height={20}
                    className="h-12 w-12 rounded-lg border object-cover"
                    title={`${fileItem.file.name} (${formatBytes(fileItem.file.size)})`}
                  />
                ) : (
                  <div
                    className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg border"
                    title={`${fileItem.file.name} (${formatBytes(fileItem.file.size)})`}
                  >
                    <FileIcon className="text-muted-foreground h-5 w-5" />
                  </div>
                )}

                <Button
                  onClick={() => removeFile(fileItem.id)}
                  variant="outline"
                  size="icon"
                  className="absolute -end-2 -top-2 size-5 rounded-full opacity-0 shadow-md transition-opacity group-hover/item:opacity-100"
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {files.length > 0 && (
          <div className="text-muted-foreground shrink-0 text-xs">
            {files.length}/{maxFiles}
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
