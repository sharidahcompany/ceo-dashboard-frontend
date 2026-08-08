import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePaginationMeta(payload: any): any {
  if (!payload) return undefined;
  if (payload.meta) return payload.meta;

  const { current_page, last_page, per_page, total, from, to, links, path } = payload;
  if (current_page !== undefined || last_page !== undefined || total !== undefined) {
    return { current_page, last_page, per_page, total, from, to, links, path };
  }

  return undefined;
}

export function getErrorMessage(
  error: unknown,
  defaultMessage = "حدث خطأ غير متوقع",
): string {
  if (isAxiosError(error)) {
    let data = error.response?.data;

    if (data instanceof ArrayBuffer) {
      try {
        data = JSON.parse(Buffer.from(data).toString("utf-8"));
      } catch {
        data = undefined;
      }
    }

    if (data) {
      if (data.errors) {
        if (typeof data.errors === "object" && !Array.isArray(data.errors)) {
          const firstKey = Object.keys(data.errors)[0];
          const firstErrArr = data.errors[firstKey];

          if (Array.isArray(firstErrArr) && firstErrArr.length > 0) {
            return String(firstErrArr[0]);
          }
        }

        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const firstErr = data.errors[0];
          if (typeof firstErr === "string") return firstErr;
          if (firstErr?.message) return String(firstErr.message);
        }
      }
      if (typeof data.message === "string" && data.message.trim() !== "") {
        return data.message;
      }


    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}

export interface RowError {
  row?: number;
  document?: string | null;
  message: string;
}

// Import endpoints report every bad row at once (not just the first), so
// callers that want to show the full list need this alongside getErrorMessage.
export function getRowErrors(error: unknown): RowError[] | undefined {
  if (isAxiosError(error) && Array.isArray(error.response?.data?.errors)) {
    return error.response.data.errors;
  }
  return undefined;
}

export interface FileDownload {
  base64: string;
  filename: string;
  contentType: string;
}

// Converts an axios arraybuffer response (used for Excel export/template
// downloads) into a base64 payload a Server Action can return to the client.
export function extractFileDownload(
  response: { data: ArrayBuffer; headers: Record<string, any> },
  fallbackFilename: string
): FileDownload {
  const base64 = Buffer.from(response.data).toString("base64");
  const contentType = response.headers["content-type"] || "application/octet-stream";
  const disposition = response.headers["content-disposition"] as string | undefined;

  let filename = fallbackFilename;
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i);
    if (match?.[1]) filename = decodeURIComponent(match[1]);
  }

  return { base64, filename, contentType };
}