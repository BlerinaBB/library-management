import { useSelect } from "@refinedev/core";
import type { BaseKey, BaseRecord } from "@refinedev/core";
import { Select } from "antd";
import { getRelationLabel } from "../config/relations";
import type { RecordId } from "../types/keys";
import type { RelationSelectProps } from "../types/relation";

/**
 * Relation select backed by Refine's `useSelect`: server-side search on the relation's
 * search field, and the selected value is fetched even when it is not on the first page.
 * Pass a different `relationSelect` component to change how options load.
 */
export function RefineRelationSelect({ relation, value, onChange, multiple, placeholder, disabled, selectProps }: RelationSelectProps) {
  const { options, onSearch, query } = useSelect<BaseRecord>({
    resource: relation.resource,
    optionLabel: (item) => getRelationLabel(relation, item),
    // Keep the raw key type, so numeric foreign keys stay numbers.
    optionValue: (item) => item[relation.valueField],
    // `useSelect` types the field as `never` for index-signature records.
    searchField: (relation.searchField ?? relation.labelField) as never,
    defaultValue: (value ?? undefined) as BaseKey | BaseKey[] | undefined,
    debounce: 300,
  });

  return (
    <Select
      allowClear
      placeholder={placeholder}
      disabled={disabled}
      loading={query.isLoading}
      {...selectProps}
      showSearch={{ onSearch, filterOption: false }}
      mode={multiple ? "multiple" : undefined}
      options={options}
      value={value ?? undefined}
      onChange={(next?: RecordId | RecordId[]) => onChange?.(next ?? undefined)}
    />
  );
}
