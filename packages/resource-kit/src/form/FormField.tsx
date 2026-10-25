import { DatePicker, Form, Input, InputNumber, Select, Switch } from "antd";
import type { ComponentType, ReactNode } from "react";
import { humanize } from "../config/defineResource";
import { currencyDisplay } from "../config/formatting";
import type { FieldDef } from "../types/field";
import type { RelationSelectProps } from "../types/relation";
import { CustomFieldControl } from "./CustomFieldControl";

export interface FormFieldProps<TForm> {
  field: FieldDef<TForm>;
  relationSelect?: ComponentType<RelationSelectProps>;
}

const fullWidth = { width: "100%" };

function renderControl<TForm>(field: FieldDef<TForm>, RelationSelect?: ComponentType<RelationSelectProps>): ReactNode {
  switch (field.type) {
    case "text":
      return <Input {...field.props} />;
    case "textarea":
      return <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} {...field.props} />;
    case "date":
      return <DatePicker style={fullWidth} {...field.props} />;
    case "boolean":
      return <Switch {...field.props} />;
    case "number":
      return <InputNumber style={fullWidth} {...field.props} />;
    case "money": {
      const display = field.currency ? currencyDisplay(field.currency, field.locale) : undefined;
      return (
        <InputNumber
          style={fullWidth}
          prefix={display?.symbol}
          precision={display?.fractionDigits ?? 2}
          {...field.props}
        />
      );
    }
    case "enum":
      return (
        <Select
          {...field.props}
          options={field.options.map(({ value, label }) => ({ value, label }))}
        />
      );
    case "relation":
      return RelationSelect ? (
        <RelationSelect relation={field.relation} multiple={field.multiple} selectProps={field.props} />
      ) : (
        <Select disabled />
      );
    case "custom":
      return <CustomFieldControl render={field.render as never} />;
  }
}

/** One Form.Item for a field definition. Boolean fields bind to `checked`. */
export function FormField<TForm>({ field, relationSelect }: FormFieldProps<TForm>) {
  return (
    <Form.Item
      // Field names are already constrained by the field factories.
      name={field.name as string}
      label={field.label ?? humanize(field.name)}
      rules={field.rules}
      valuePropName={field.type === "boolean" ? "checked" : undefined}
      {...field.formItemProps}
    >
      {renderControl(field, relationSelect)}
    </Form.Item>
  );
}
