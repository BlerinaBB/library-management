import type {
  DatePickerProps,
  FormInstance,
  FormItemProps,
  FormRule,
  GetProps,
  Input,
  InputNumberProps,
  InputProps,
  SelectProps,
  SwitchProps,
} from "antd";
import type { Dayjs } from "dayjs";
import type { ReactNode } from "react";
import type { BooleanKey, EnumKey, KeysOfType, NumberKey, RecordId, StringKey } from "./keys";
import type { EnumOption } from "./options";
import type { AnyRelation, RelationSelectProps } from "./relation";

export type TextAreaProps = GetProps<typeof Input.TextArea>;

interface FieldBase<K extends string> {
  name: K;
  label?: ReactNode;
  /** Consumer-owned validation rules. */
  rules?: FormRule[];
  formItemProps?: Omit<FormItemProps, "name" | "label" | "rules" | "children">;
}

export interface TextFieldDef<TForm> extends FieldBase<StringKey<TForm>> {
  type: "text";
  props?: InputProps;
}

export interface TextareaFieldDef<TForm> extends FieldBase<StringKey<TForm>> {
  type: "textarea";
  props?: TextAreaProps;
}

/** Date fields hold `Dayjs` values in the form; convert API values with `toDayjs`/`fromDayjs`. */
export interface DateFieldDef<TForm> extends FieldBase<KeysOfType<TForm, Dayjs>> {
  type: "date";
  props?: DatePickerProps;
}

export interface BooleanFieldDef<TForm> extends FieldBase<BooleanKey<TForm>> {
  type: "boolean";
  props?: SwitchProps;
}

export interface NumberFieldDef<TForm> extends FieldBase<NumberKey<TForm>> {
  type: "number";
  props?: InputNumberProps;
}

export interface MoneyFieldDef<TForm> extends FieldBase<NumberKey<TForm>> {
  type: "money";
  currency?: string;
  locale?: string;
  props?: InputNumberProps;
}

export interface EnumFieldDef<TForm> extends FieldBase<EnumKey<TForm>> {
  type: "enum";
  options: ReadonlyArray<EnumOption>;
  props?: Omit<SelectProps, "options">;
}

export interface RelationFieldDef<TForm> extends FieldBase<KeysOfType<TForm, RecordId | RecordId[]>> {
  type: "relation";
  relation: AnyRelation;
  multiple?: boolean;
  props?: RelationSelectProps["selectProps"];
}

/** Props passed to a custom field renderer. `value`/`onChange` come from the enclosing Form.Item. */
export interface CustomFieldRenderProps<TForm, K extends keyof TForm> {
  id?: string;
  value: TForm[K] | undefined;
  onChange: (value: TForm[K]) => void;
  form: FormInstance<TForm>;
}

export interface CustomFieldDef<TForm, K extends keyof TForm & string> extends FieldBase<K> {
  type: "custom";
  render: (props: CustomFieldRenderProps<TForm, K>) => ReactNode;
}

/** Custom field definitions for every key, so `render` sees the exact value type of its field. */
export type AnyCustomFieldDef<TForm> = {
  [K in keyof TForm & string]: CustomFieldDef<TForm, K>;
}[keyof TForm & string];

export type FieldDef<TForm> =
  | TextFieldDef<TForm>
  | TextareaFieldDef<TForm>
  | DateFieldDef<TForm>
  | BooleanFieldDef<TForm>
  | NumberFieldDef<TForm>
  | MoneyFieldDef<TForm>
  | EnumFieldDef<TForm>
  | RelationFieldDef<TForm>
  | AnyCustomFieldDef<TForm>;

