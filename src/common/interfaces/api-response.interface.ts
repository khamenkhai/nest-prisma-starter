export interface ApiResponse<T = unknown> {
  data: T;
}

export type SingleResponse<T> = ApiResponse<T>;

export type ListResponse<T> = ApiResponse<T[]>;

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
