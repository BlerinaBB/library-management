import { Form, Spin } from "antd";
import type { FormProps } from "antd";
import { useEffect } from "react";
import type { ComponentType, ReactNode } from "react";
import type { FieldDef } from "../types/field";
import type { RelationSelectProps } from "../types/relation";
import { FormField } from "./FormField";

export interface ResourceFormProps<TForm> extends Omit<FormProps<TForm>, "fields" | "children"> {
  fields: ReadonlyArray<FieldDef<TForm>>;
  /** Shows a spinner and disables inputs, e.g. while the edited record loads. */
  loading?: boolean;
  /**
   * Changing this value resets every field to `initialValues`. The reset runs after this
   * form has received the new `initialValues`, so switching records never shows stale values.
   * Leave undefined to manage resets yourself.
   */
  resetKey?: string | number;
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
  resetKey,
  relationSelect,
  children,
  layout = "vertical",
  disabled,
  form: formFromProps,
  ...formProps
}: ResourceFormProps<TForm>) {
  const [form] = Form.useForm<TForm>(formFromProps);

  useEffect(() => {
    if (resetKey !== undefined) form.resetFields();
  }, [form, resetKey]);

  return (
    <Spin spinning={loading}>
      <Form<TForm> form={form} layout={layout} disabled={disabled || loading} {...formProps}>
        {fields.map((field) => (
          <FormField<TForm> key={field.name} field={field} relationSelect={relationSelect} />
        ))}
        {children}
      </Form>
    </Spin>
  );
}
