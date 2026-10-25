import type { Dayjs } from "dayjs";

/** Author as returned by the API. */
export interface Author {
  id: number;
  name: string;
  nationality: string;
  /** ISO date, `YYYY-MM-DD`. */
  birthDate: string | null;
  bio: string | null;
  active: boolean;
}

/** Form values: the date picker works with `Dayjs`. */
export interface AuthorFormValues {
  name: string;
  nationality: string;
  birthDate: Dayjs | null;
  bio: string | null;
  active: boolean;
}

/** Create/update payload. */
export type AuthorVariables = Omit<Author, "id">;
