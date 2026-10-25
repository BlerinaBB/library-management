import type { RelationColumn, ResourceColumn } from "../types/column";
import type { AnyRelation } from "../types/relation";
import type { ResourceConfig } from "../types/resource";
import { uniqueRelations } from "./relations";

/**
 * Declares a resource. Pass the record type (and, when they differ, the form and
 * mutation variable types) explicitly; factories used inside infer their keys from it.
 */
export function defineResource<TRecord, TForm = TRecord, TVariables = Partial<TRecord>>(
  config: ResourceConfig<TRecord, TForm, TVariables>,
): ResourceConfig<TRecord, TForm, TVariables> {
  return config;
}

export function isRelationColumn<T>(column: ResourceColumn<T>): column is RelationColumn<T> {
  return "bind" in column && typeof column.bind === "function";
}

/** Relations needing batch resolution for a table: declared relations plus those used by columns. */
export function tableRelations<T>(
  relations: Readonly<Record<string, AnyRelation<T>>> | undefined,
  columns: ReadonlyArray<ResourceColumn<T>>,
): AnyRelation<T>[] {
  const fromColumns = columns.filter(isRelationColumn).map((column) => column.relation);
  return uniqueRelations([...Object.values(relations ?? {}), ...fromColumns]);
}

/** Humanizes a field key for default titles: `birthDate` → `Birth date`. */
export function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
