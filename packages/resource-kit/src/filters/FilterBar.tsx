import { Flex, Typography } from "antd";
import type { ComponentType, ReactNode } from "react";
import type { FilterDef, FilterValues } from "../types/filter";
import type { RelationSelectProps } from "../types/relation";
import { FilterControl } from "./FilterControl";
import { setFilterValue } from "./filterValues";

export interface FilterBarProps<T> {
  filters: ReadonlyArray<FilterDef<T>>;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  relationSelect?: ComponentType<RelationSelectProps>;
  anyLabel?: string;
  /** Content aligned to the end of the bar, e.g. bulk actions. */
  extra?: ReactNode;
}

/** Renders filter controls and emits the next controlled state. It does not know how filters are applied. */
export function FilterBar<T>({ filters, values, onChange, relationSelect, anyLabel, extra }: FilterBarProps<T>) {
  return (
    <Flex gap="middle" wrap align="end" justify="space-between">
      <Flex gap="middle" wrap align="end">
        {filters.map((filter) => (
          <Flex key={filter.key} vertical gap={4}>
            <Typography.Text type="secondary">{filter.label}</Typography.Text>
            <FilterControl
              filter={filter}
              value={values[filter.key]}
              onChange={(value) => onChange(setFilterValue(values, filter.key, value))}
              relationSelect={relationSelect}
              anyLabel={anyLabel}
            />
          </Flex>
        ))}
      </Flex>
      {extra}
    </Flex>
  );
}
