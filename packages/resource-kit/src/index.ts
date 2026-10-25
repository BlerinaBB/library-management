// Public API of @library/resource-kit. Anything not exported here is private.
// This module must stay free of side effects: no global registration, no provider setup.

// Configuration
export { defineResource, isRelationColumn, tableRelations } from "./config/defineResource";
export { defineRelation, relationKey, getRelationLabel, collectForeignIds, buildRelationLookup } from "./config/relations";
export { isMissing, formatDate, formatNumber, formatMoney } from "./config/formatting";
export { defaultTexts } from "./config/texts";
export type { ResourceTexts } from "./config/texts";

// Columns
export { columns, createColumnFactories } from "./columns/createColumnFactories";
export type {
  ColumnFactories,
  LongTextColumnOptions,
  EnumColumnOptions,
  RelationColumnOptions,
  ActionsColumnOptions,
} from "./columns/createColumnFactories";
export { resolveColumns } from "./columns/resolveColumns";
export { RowActions } from "./columns/RowActions";
export type { RowActionsProps } from "./columns/RowActions";

// Filters
export { filters } from "./filters/filterFactories";
export type {
  FilterFactories,
  TextFilterOptions,
  BooleanFilterOptions,
  EnumFilterOptions,
  RelationFilterOptions,
} from "./filters/filterFactories";
export { isEmptyFilterValue, setFilterValue } from "./filters/filterValues";
export { FilterBar } from "./filters/FilterBar";
export type { FilterBarProps } from "./filters/FilterBar";
export { FilterControl } from "./filters/FilterControl";
export type { FilterControlProps } from "./filters/FilterControl";

// Table
export { DataTable } from "./table/DataTable";
export type { DataTableProps } from "./table/DataTable";
export { composeHandlers } from "./table/composeHandlers";

// Form
export { fields } from "./form/fieldFactories";
export type { FieldFactories } from "./form/fieldFactories";
export { toDayjs, fromDayjs } from "./form/formValues";
export { ResourceForm } from "./form/ResourceForm";
export type { ResourceFormProps } from "./form/ResourceForm";

// Drawer
export { ResourceDrawer } from "./drawer/ResourceDrawer";
export type { ResourceDrawerProps, DrawerFooterContext } from "./drawer/ResourceDrawer";
export { useDrawerState } from "./drawer/useDrawerState";
export type { DrawerStateApi } from "./drawer/useDrawerState";

// Refine integration
export { useResourceController } from "./hooks/useResourceController";
export type { ResourceController, ResourceControllerOptions, DeleteFlow } from "./hooks/useResourceController";
export { useRelationLookup } from "./hooks/useRelationLookup";
export type { RelationLookupOptions, RelationLookupResult } from "./hooks/useRelationLookup";
export { toRefineFilters, fromRefineFilters, toRefineSorters } from "./hooks/refineTranslation";

// Composition
export { ResourcePage } from "./resource/ResourcePage";
export type { ResourcePageProps } from "./resource/ResourcePage";
export { ResourceHeader } from "./resource/ResourceHeader";
export type { ResourceHeaderProps } from "./resource/ResourceHeader";
export { DeleteConfirmModal } from "./resource/DeleteConfirmModal";
export type { DeleteConfirmModalProps } from "./resource/DeleteConfirmModal";
export { RelationResolver } from "./resource/RelationResolver";
export type { RelationResolverProps } from "./resource/RelationResolver";
export { RefineRelationSelect } from "./resource/RefineRelationSelect";

// Types
export type { RecordId, DateInput, KeysOfType, StringKey, NumberKey, BooleanKey, DateKey, IdKey, EnumKey } from "./types/keys";
export type { FormatOptions } from "./types/format";
export type { EnumOption } from "./types/options";
export type { RelationDef, AnyRelation, RelationLookup, RelationData, RelationSelectProps } from "./types/relation";
export type { TableColumn, ColumnOptions, RelationColumn, ResourceColumn, RowAction } from "./types/column";
export type {
  FilterOperator,
  FilterValue,
  FilterValues,
  FilterDef,
  TextFilterDef,
  BooleanFilterDef,
  EnumFilterDef,
  RelationFilterDef,
} from "./types/filter";
export type {
  FieldDef,
  TextFieldDef,
  TextareaFieldDef,
  DateFieldDef,
  BooleanFieldDef,
  NumberFieldDef,
  MoneyFieldDef,
  EnumFieldDef,
  RelationFieldDef,
  CustomFieldDef,
  CustomFieldRenderProps,
} from "./types/field";
export type { DrawerState, OpenDrawerState } from "./types/drawer";
export type {
  ResourceConfig,
  ResourceLabels,
  ResourceTableConfig,
  ResourceFormConfig,
  FormConversion,
  FormConversionContext,
  SortDef,
} from "./types/resource";
