import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(
  error: unknown,
  defaultMessage = "حدث خطأ غير متوقع",
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;

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