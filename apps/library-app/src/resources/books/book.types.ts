import type { Dayjs } from "dayjs";

export type Genre = "fiction" | "non-fiction" | "poetry" | "biography" | "science";

/** Book as returned by the API. */
export interface Book {
  id: number;
  title: string;
  isbn: string;
  genre: Genre;
  /** ISO date, `YYYY-MM-DD`. */
  publishedDate: string | null;
  pageCount: number | null;
  price: number;
  inStock: boolean;
  authorId: number;
}

export type BookFormValues = Omit<Book, "id" | "publishedDate"> & { publishedDate: Dayjs | null };

export type BookVariables = Omit<Book, "id">;
