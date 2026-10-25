import { defineRelation } from "../src/config/relations";

export interface Author {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  genre: "fiction" | "poetry";
  pageCount: number | null;
  price: number;
  inStock: boolean;
  publishedDate: string | null;
  authorId: number | null;
}

export const bookAuthor = defineRelation<Book, Author>({
  resource: "authors",
  foreignKey: "authorId",
  valueField: "id",
  labelField: "name",
});

export function book(overrides: Partial<Book> = {}): Book {
  return {
    id: 1,
    title: "Dubliners",
    genre: "fiction",
    pageCount: 0,
    price: 0,
    inStock: false,
    publishedDate: null,
    authorId: 7,
    ...overrides,
  };
}
