import type { ReactNode } from "react";
import type { RelationLookupOptions } from "../hooks/useRelationLookup";
import type { AnyRelation, RelationData } from "../types/relation";
import { RelationLookupStep } from "./RelationLookupStep";

const NO_RELATION_DATA: RelationData = {};

export interface RelationResolverProps<T> extends RelationLookupOptions {
  /** Relations to resolve. Keep the array stable (e.g. from `useResourceController().relations`). */
  relations: ReadonlyArray<AnyRelation<T>>;
  /** Records whose foreign keys are resolved, normally the current page. */
  records: ReadonlyArray<T>;
  children: (relationData: RelationData, loading: boolean) => ReactNode;
}

/**
 * Batch-resolves relations for a set of records: one `getMany` per relation over the
 * unique foreign keys, never one request per row. Pass the result to `DataTable`.
 */
export function RelationResolver<T>({ relations, records, children, ...options }: RelationResolverProps<T>) {
  const [first, ...rest] = relations;
  if (!first) return <>{children(NO_RELATION_DATA, false)}</>;
  return (
    <RelationLookupStep relation={first} rest={rest} records={records} resolved={NO_RELATION_DATA} loading={false} {...options}>
      {children}
    </RelationLookupStep>
  );
}
