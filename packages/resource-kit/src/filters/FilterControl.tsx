import { Input, Select } from "antd";
import type { ComponentType } from "react";
import type { FilterDef, FilterValue } from "../types/filter";
import type { RecordId } from "../types/keys";
import type { RelationSelectProps } from "../types/relation";

export interface FilterControlProps<T> {
  filter: FilterDef<T>;
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  /** Component used for relation filters. Without it relation filters render disabled. */
  relationSelect?: ComponentType<RelationSelectProps>;
  anyLabel?: string;
}

const controlStyle = { minWidth: 180 };

export function FilterControl<T>({ filter, value, onChange, relationSelect: RelationSelect, anyLabel = "Any" }: FilterControlProps<T>) {
  switch (filter.type) {
    case "text":
      return (
        <Input
          allowClear
          style={controlStyle}
          placeholder={filter.placeholder}
          {...filter.inputProps}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case "boolean":
      // Select values are strings so that `false` survives as a selection instead of reading as "cleared".
      return (
        <Select
          allowClear
          style={controlStyle}
          placeholder={filter.placeholder ?? anyLabel}
          value={typeof value === "boolean" ? String(value) : undefined}
          onChange={(next?: string) => onChange(next === undefined ? undefined : next === "true")}
          options={[
            { value: "true", label: filter.trueLabel },
            { value: "false", label: filter.falseLabel },
          ]}
        />
      );

    case "enum":
      return (
        <Select
          allowClear
          style={controlStyle}
          placeholder={filter.placeholder ?? anyLabel}
          {...filter.selectProps}
          mode={filter.multiple ? "multiple" : undefined}
          value={value as RecordId | RecordId[] | undefined}
          onChange={(next?: RecordId | RecordId[]) => onChange(next)}
          options={filter.options.map(({ value: optionValue, label }) => ({ value: optionValue, label }))}
        />
      );

    case "relation":
      return RelationSelect ? (
        <RelationSelect
          relation={filter.relation}
          multiple={filter.multiple}
          placeholder={filter.placeholder ?? anyLabel}
          selectProps={{ style: controlStyle, allowClear: true, ...filter.selectProps }}
          value={value as RecordId | RecordId[] | undefined}
          onChange={(next) => onChange(next)}
        />
      ) : (
        <Select disabled style={controlStyle} placeholder={filter.placeholder ?? anyLabel} />
      );
  }
}
