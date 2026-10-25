import { defineRelation } from "../src/config/relations";

export const AUTHOR_A = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
export const AUTHOR_B = "9b2f3d1e-5a6c-4e8f-b0d2-c4a6e8f0a1b3";
export const AUTHOR_MISSING = "3f2b8c1e-9d4a-4e7b-a6c2-5f1e8d9b0a47";

export interface Author {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  genre: "fiction" | "poetry";
  pageCount: number | null;
  price: number;
  inStock: boolean;
  publishedDate: string | null;
  authorId: string | null;
}

export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors",
  foreignKey: "authorId",
  valueField: "id",
  labelField: "name",
});

export function book(overrides: Partial<Book> = {}): Book {
  return {
    id: "0f8fad5b-d9cb-469f-a165-70867728950e",
    title: "Dubliners",
    genre: "fiction",
    pageCount: 0,
    price: 0,
    inStock: false,
    publishedDate: null,
    authorId: AUTHOR_A,
    ...overrides,
  };
}
