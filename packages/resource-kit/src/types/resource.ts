import type { ResourceColumn } from "./column";
import type { FieldDef } from "./field";
import type { FilterDef } from "./filter";
import type { AnyRelation } from "./relation";

export interface ResourceLabels {
  singular: string;
  plural: string;
}

export interface SortDef<T> {
  field: keyof T & string;
  order: "asc" | "desc";
}

export interface ResourceTableConfig<TRecord> {
  columns: ReadonlyArray<ResourceColumn<TRecord>>;
  filters?: ReadonlyArray<FilterDef<TRecord>>;
  initialSorters?: ReadonlyArray<SortDef<TRecord>>;
  pageSize?: number;
}

export interface FormConversionContext<TRecord> {
  mode: "create" | "edit";
  /** The loaded record when editing. */
  record?: TRecord;
}

type ToFormValues<TRecord, TForm> = (record: TRecord) => TForm;
type ToVariables<TRecord, TForm, TVariables> = (values: TForm, context: FormConversionContext<TRecord>) => TVariables;

/**
 * Conversions are optional only when the types already line up:
 * `toFormValues` when an API record is a valid form value, `toVariables` when form values are valid mutation variables.
 */
export type FormConversion<TRecord, TForm, TVariables> = ([TRecord] extends [TForm]
  ? { toFormValues?: ToFormValues<TRecord, TForm> }
  : { toFormValues: ToFormValues<TRecord, TForm> }) &
  ([TForm] extends [TVariables]
    ? { toVariables?: ToVariables<TRecord, TForm, TVariables> }
    : { toVariables: ToVariables<TRecord, TForm, TVariables> });

export type ResourceFormConfig<TRecord, TForm, TVariables> = {
  /** One definition list shared by create and edit. */
  fields: ReadonlyArray<FieldDef<TForm>>;
  /** Form values used when creating. */
  initialValues?: Partial<TForm>;
} & FormConversion<TRecord, TForm, TVariables>;

/**
 * Describes one resource: what it is called, how it is listed, and how it is edited.
 * Infrastructure (data provider, routes, permissions) stays in the host application.
 *
 * @typeParam TRecord - Record shape returned by the API.
 * @typeParam TForm - Values held by the form (e.g. `Dayjs` instead of date strings).
 * @typeParam TVariables - Payload sent to create/update mutations.
 */
export interface ResourceConfig<TRecord, TForm = TRecord, TVariables = Partial<TRecord>> {
  /** Resource name as registered with the host data provider. */
  name: string;
  labels: ResourceLabels;
  /** Field holding the record key. Defaults to `"id"`. */
  recordKey?: keyof TRecord & string;
  /** Named relations of this resource. They are resolved for the table and reused by columns, filters and fields. */
  relations?: Readonly<Record<string, AnyRelation<TRecord>>>;
  table: ResourceTableConfig<TRecord>;
  form: ResourceFormConfig<TRecord, TForm, TVariables>;
}
