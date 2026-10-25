import type {
  BooleanFieldDef,
  CustomFieldDef,
  DateFieldDef,
  EnumFieldDef,
  MoneyFieldDef,
  NumberFieldDef,
  RelationFieldDef,
  TextareaFieldDef,
  TextFieldDef,
} from "../types/field";
import type { BooleanKey, EnumKey, KeysOfType, NumberKey, RecordId, StringKey } from "../types/keys";
import type { Dayjs } from "dayjs";
import type { EnumOption } from "../types/options";
import type { AnyRelation } from "../types/relation";

type Options<D> = Omit<D, "type" | "name">;

export interface FieldFactories {
  text<TForm>(name: StringKey<TForm>, options?: Options<TextFieldDef<TForm>>): TextFieldDef<TForm>;
  textarea<TForm>(name: StringKey<TForm>, options?: Options<TextareaFieldDef<TForm>>): TextareaFieldDef<TForm>;
  /** The form value must be a `Dayjs`; convert API values in `toFormValues`/`toVariables`. */
  date<TForm>(name: KeysOfType<TForm, Dayjs>, options?: Options<DateFieldDef<TForm>>): DateFieldDef<TForm>;
  boolean<TForm>(name: BooleanKey<TForm>, options?: Options<BooleanFieldDef<TForm>>): BooleanFieldDef<TForm>;
  number<TForm>(name: NumberKey<TForm>, options?: Options<NumberFieldDef<TForm>>): NumberFieldDef<TForm>;
  money<TForm>(name: NumberKey<TForm>, options?: Options<MoneyFieldDef<TForm>>): MoneyFieldDef<TForm>;
  enum<TForm, K extends EnumKey<TForm>>(
    name: K,
    options: Omit<Options<EnumFieldDef<TForm>>, "options"> & {
      options: ReadonlyArray<EnumOption<Extract<NonNullable<TForm[K]>, string | number>>>;
    },
  ): EnumFieldDef<TForm>;
  /**
   * A select of related records. `name` is checked against the form type; the relation
   * supplies the related resource, value and label fields.
   */
  relation<TForm>(
    name: KeysOfType<TForm, RecordId | RecordId[]>,
    relation: AnyRelation,
    options?: Omit<Options<RelationFieldDef<TForm>>, "relation">,
  ): RelationFieldDef<TForm>;
  /** Renders any control; `render` receives the typed value and change handler of its field. */
  custom<TForm, K extends keyof TForm & string>(
    name: K,
    options: Options<CustomFieldDef<TForm, K>>,
  ): CustomFieldDef<TForm, K>;
}

/** Pure factories for form field definitions. */
export const fields: FieldFactories = {
  text: (name, options) => ({ type: "text", name, ...options }),
  textarea: (name, options) => ({ type: "textarea", name, ...options }),
  date: (name, options) => ({ type: "date", name, ...options }),
  boolean: (name, options) => ({ type: "boolean", name, ...options }),
  number: (name, options) => ({ type: "number", name, ...options }),
  money: (name, options) => ({ type: "money", name, ...options }),
  enum: (name, options) => ({ type: "enum", name, ...options }),
  relation: (name, relation, options) => ({ type: "relation", name, relation, ...options }),
  custom: (name, options) => ({ type: "custom", name, ...options }),
};
