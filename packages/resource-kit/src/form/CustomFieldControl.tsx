import { Form } from "antd";
import type { ReactNode } from "react";
import type { CustomFieldRenderProps } from "../types/field";

export interface CustomFieldControlProps {
  render: (props: CustomFieldRenderProps<any, any>) => ReactNode;
  /** Injected by the enclosing Form.Item. */
  id?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

/** Bridges Form.Item's injected `value`/`onChange` to a custom field's render callback. */
export function CustomFieldControl({ render, id, value, onChange }: CustomFieldControlProps) {
  const form = Form.useFormInstance();
  return <>{render({ id, value, onChange: (next) => onChange?.(next), form })}</>;
}
