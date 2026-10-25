import { Form, Spin } from "antd";
import type { FormProps } from "antd";
import type { ComponentType, ReactNode } from "react";
import type { FieldDef } from "../types/field";
import type { RelationSelectProps } from "../types/relation";
import { FormField } from "./FormField";

export interface ResourceFormProps<TForm> extends Omit<FormProps<TForm>, "fields" | "children"> {
  fields: ReadonlyArray<FieldDef<TForm>>;
  /** Shows a spinner and disables inputs, e.g. while the edited record loads. */
  loading?: boolean;
  /** Component used by relation fields. */
  relationSelect?: ComponentType<RelationSelectProps>;
  /** Extra content rendered after the generated fields. */
  children?: ReactNode;
}

/**
 * Renders field definitions inside an Ant Design Form. It owns no data requests:
 * pass `form`, `initialValues` and `onFinish` from a controller or your own code.
 */
export function ResourceForm<TForm>({
  fields,
  loading = false,
  relationSelect,
  children,
  layout = "vertical",
  disabled,
  ...formProps
}: ResourceFormProps<TForm>) {
  return (
    <Spin spinning={loading}>
      <Form<TForm> layout={layout} disabled={disabled || loading} {...formProps}>
        {fields.map((field) => (
          <FormField<TForm> key={field.name} field={field} relationSelect={relationSelect} />
        ))}
        {children}
      </Form>
    </Spin>
  );
}
