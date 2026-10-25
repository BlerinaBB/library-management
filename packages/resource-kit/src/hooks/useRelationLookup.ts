import { useMany } from "@refinedev/core";
import type { MetaQuery } from "@refinedev/core";
import { useMemo } from "react";
import { buildRelationLookup, collectForeignIds } from "../config/relations";
import type { RelationDef, RelationLookup } from "../types/relation";

export interface RelationLookupOptions {
  dataProviderName?: string;
  meta?: MetaQuery;
}

export interface RelationLookupResult<R> {
  /** `undefined` until the related records are available. */
  lookup: RelationLookup<R> | undefined;
  isLoading: boolean;
}

const EMPTY_LOOKUP: RelationLookup = new Map();

/**
 * Resolves one relation for the given records with a single `getMany` call over their unique
 * foreign keys. Identical id sets share Refine's query cache, so there are no per-row requests.
 */
export function useRelationLookup<T, R = any>(
  relation: RelationDef<T, R>,
  records: ReadonlyArray<T>,
  options: RelationLookupOptions = {},
): RelationLookupResult<R> {
  const ids = useMemo(() => collectForeignIds(records, relation), [records, relation]);
  const { query } = useMany({
    resource: relation.resource,
    ids,
    dataProviderName: options.dataProviderName,
    meta: options.meta,
    queryOptions: { enabled: ids.length > 0 },
  });
  // The query cache keeps this reference stable between renders.
  const data = query.data?.data as R[] | undefined;
  const lookup = useMemo(() => (data ? buildRelationLookup<R>(relation, data) : undefined), [data, relation]);
  return {
    lookup: ids.length === 0 ? EMPTY_LOOKUP : lookup,
    isLoading: ids.length > 0 && query.isLoading,
  };
}
