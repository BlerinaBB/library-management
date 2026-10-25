import { getRelationLabel } from "@library/resource-kit";
import type { RecordId, RelationSelectProps } from "@library/resource-kit";
import { Select } from "antd";
import { AUTHORS } from "./library";

const RECORDS: Record<string, ReadonlyArray<Record<string, unknown>>> = { authors: AUTHORS as never };

/**
 * A `relationSelect` implementation backed by local fixtures instead of Refine.
 * It demonstrates the injection point: presentation components accept any component
 * that fulfils `RelationSelectProps`.
 */
export function StaticRelationSelect({ relation, value, onChange, multiple, placeholder, disabled, selectProps }: RelationSelectProps) {
  const options = (RECORDS[relation.resource] ?? []).map((record) => ({
    value: record[relation.valueField] as RecordId,
    label: getRelationLabel(relation, record),
  }));
  return (
    <Select
      allowClear
      placeholder={placeholder}
      disabled={disabled}
      {...selectProps}
      showSearch={{ optionFilterProp: "label" }}
      mode={multiple ? "multiple" : undefined}
      options={options}
      value={value ?? undefined}
      onChange={(next?: RecordId | RecordId[]) => onChange?.(next ?? undefined)}
    />
  );
}
