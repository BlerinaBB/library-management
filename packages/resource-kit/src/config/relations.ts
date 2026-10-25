import type { RecordId } from "../types/keys";
import type { AnyRelation, RelationDef, RelationLookup } from "../types/relation";
import { isMissing } from "./formatting";

/**
 * Marks a relation whose related records are still loading for the current records.
 * Relation columns render a loading indicator for it instead of a "missing" reference.
 */
export const PENDING_LOOKUP: RelationLookup = new Map();

/** Identity helper that checks a relation against both record types. */
export function defineRelation<T, R>(relation: RelationDef<T, R>): RelationDef<T, R> {
  return relation;
}

/** Stable key identifying a relation's lookup within `RelationData`. */
export function relationKey(relation: AnyRelation): string {
  return `${relation.resource}:${relation.valueField}`;
}

export function getRelationLabel<R>(relation: RelationDef<any, R>, related: R): string {
  if (relation.formatLabel) return relation.formatLabel(related);
  const label = (related as Record<string, unknown>)[relation.labelField];
  return isMissing(label) ? "" : String(label);
}

/** Unique, non-missing foreign keys of the given records, sorted so that query keys stay stable. */
export function collectForeignIds<T>(records: ReadonlyArray<T>, relation: AnyRelation<T>): RecordId[] {
  const unique = new Map<string, RecordId>();
  for (const record of records) {
    const id = (record as Record<string, unknown>)[relation.foreignKey];
    if ((typeof id === "string" || typeof id === "number") && !isMissing(id)) unique.set(String(id), id);
  }
  return [...unique.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, id]) => id);
}

/** Indexes related records by `String(valueField)`. */
export function buildRelationLookup<R>(relation: AnyRelation, related: ReadonlyArray<R>): RelationLookup<R> {
  const lookup = new Map<string, R>();
  for (const item of related) {
    const key = (item as Record<string, unknown>)[relation.valueField];
    if (!isMissing(key)) lookup.set(String(key), item);
  }
  return lookup;
}

/** Deduplicates relations by `relationKey`, keeping the first occurrence. */
export function uniqueRelations<T>(relations: Iterable<AnyRelation<T>>): AnyRelation<T>[] {
  const byKey = new Map<string, AnyRelation<T>>();
  for (const relation of relations) {
    const key = relationKey(relation);
    if (!byKey.has(key)) byKey.set(key, relation);
  }
  return [...byKey.values()];
}
