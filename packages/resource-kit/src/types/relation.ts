import type { SelectProps } from "antd";
import type { IdKey, KeysOfType, RecordId, StringKey } from "./keys";

/**
 * Describes a many-to-one reference from `T` to records of another resource.
 * The same object drives relation columns, relation filters and relation fields.
 */
export interface RelationDef<T, R = any> {
  /** Name of the related resource as known by the host data provider. */
  resource: string;
  /** Field on `T` holding the related record's key. */
  foreignKey: IdKey<T>;
  /** Field on the related record matched by `foreignKey`. Batch lookups use `getMany`, so this is normally its primary key. */
  valueField: KeysOfType<R, RecordId>;
  /** Field on the related record used as its label. */
  labelField: StringKey<R>;
  /** Overrides `labelField` when a label needs more than one field. */
  formatLabel?: (related: R) => string;
  /** Field searched by relation selects. Defaults to `labelField`. */
  searchField?: StringKey<R>;
}

/** A relation of `T` with an unspecified related type. */
export type AnyRelation<T = any> = RelationDef<T, any>;

/** Related records of one relation, keyed by `String(valueField)`. */
export type RelationLookup<R = any> = ReadonlyMap<string, R>;

/** Resolved lookups for several relations, keyed by `relationKey(relation)`. */
export type RelationData = Readonly<Record<string, RelationLookup>>;

/** Contract for components that let users pick related records. */
export interface RelationSelectProps {
  relation: AnyRelation;
  value?: RecordId | RecordId[] | null;
  onChange?: (value: RecordId | RecordId[] | undefined) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  selectProps?: Omit<SelectProps, "value" | "onChange" | "mode" | "options">;
}
