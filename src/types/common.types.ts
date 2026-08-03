export type ApiResponse<T = null> = {
  data?: T;
  message?: string;
};

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export type PaginatedApiResponse<T = null> =
  | {
      data?: T;
      meta?: PaginationMeta;
      message?: string;
      success?: boolean;
    }
  | { error: string; success: boolean };
