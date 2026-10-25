import { useMemo } from "react";
import type { ReactNode } from "react";
import { PENDING_LOOKUP, relationKey } from "../config/relations";
import type { RelationLookupOptions } from "../hooks/useRelationLookup";
import { useRelationLookup } from "../hooks/useRelationLookup";
import type { AnyRelation, RelationData } from "../types/relation";

export interface RelationLookupStepProps<T> extends RelationLookupOptions {
  relation: AnyRelation<T>;
  rest: ReadonlyArray<AnyRelation<T>>;
  records: ReadonlyArray<T>;
  resolved: RelationData;
  loading: boolean;
  children: (relationData: RelationData, loading: boolean) => ReactNode;
}

/**
 * Resolves one relation, then renders the next step. Each relation gets its own component
 * instance, so every hook call has a fixed position in a component instead of a loop.
 */
export function RelationLookupStep<T>({ relation, rest, records, resolved, loading, children, ...options }: RelationLookupStepProps<T>) {
  const { lookup, isLoading } = useRelationLookup(relation, records, options);
  const key = relationKey(relation);
  // Loading → PENDING_LOOKUP (cells show a spinner); failed → no entry (cells fall back to raw keys).
  const current = lookup ?? (isLoading ? PENDING_LOOKUP : undefined);
  const data = useMemo(() => (current ? { ...resolved, [key]: current } : resolved), [resolved, key, current]);
  const stillLoading = loading || isLoading;
  const [next, ...remaining] = rest;

  if (!next) return <>{children(data, stillLoading)}</>;
  return (
    <RelationLookupStep relation={next} rest={remaining} records={records} resolved={data} loading={stillLoading} {...options}>
      {children}
    </RelationLookupStep>
  );
}
