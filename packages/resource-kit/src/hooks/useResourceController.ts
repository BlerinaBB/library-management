import { useCreate, useDelete, useOne, useTable, useUpdate } from "@refinedev/core";
import type { BaseKey, BaseRecord, CrudSort, HttpError, IQueryKeys, MetaQuery } from "@refinedev/core";
import { Form } from "antd";
import type { FormInstance, TableProps } from "antd";
import { useCallback, useMemo, useState } from "react";
import { tableRelations } from "../config/defineResource";
import { useDrawerState } from "../drawer/useDrawerState";
import type { DrawerStateApi } from "../drawer/useDrawerState";
import type { DataTableProps } from "../table/DataTable";
import type { ResourceFormProps } from "../form/ResourceForm";
import type { ResourceDrawerProps } from "../drawer/ResourceDrawer";
import type { FilterDef, FilterValues } from "../types/filter";
import type { AnyRelation } from "../types/relation";
import type { FormConversionContext, ResourceConfig } from "../types/resource";
import { fromRefineFilters, toRefineFilters, toRefineSorters, toSortDefs } from "./refineTranslation";

export interface ResourceControllerOptions<TRecord> {
  dataProviderName?: string;
  meta?: MetaQuery;
  /** Mirror pagination, sorting and filters in the URL (needs a Refine router provider). */
  syncWithLocation?: boolean;
  /** Query groups invalidated after mutations. Defaults to list, many and detail. */
  invalidates?: Array<keyof IQueryKeys>;
  onSaved?: (mode: "create" | "edit", record: TRecord | undefined) => void;
  onDeleted?: (record: TRecord) => void;
}

export interface DeleteFlow<TRecord> {
  /** Record awaiting confirmation, or `null`. */
  target: TRecord | null;
  request: (record: TRecord) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
  isDeleting: boolean;
}

export interface ResourceController<TRecord, TForm> {
  /** Records of the current page. */
  records: TRecord[];
  /** Relations to batch-resolve for the current page (see `RelationResolver`). */
  relations: AnyRelation<TRecord>[];
  getRecordId: (record: TRecord) => BaseKey;
  /** Spread onto `DataTable`. */
  tableProps: DataTableProps<TRecord> & Required<Pick<DataTableProps<TRecord>, "onChange" | "onFilterValuesChange">>;
  drawer: DrawerStateApi;
  /** Opens the drawer for an existing record. */
  edit: (record: TRecord) => void;
  /** Spread onto `ResourceDrawer`. */
  drawerProps: Omit<ResourceDrawerProps, "children">;
  /** Spread onto `ResourceForm`. */
  formProps: ResourceFormProps<TForm> & { form: FormInstance<TForm> };
  deletion: DeleteFlow<TRecord>;
  /** The record being edited, once loaded. */
  editedRecord: TRecord | undefined;
}

const DEFAULT_INVALIDATES: Array<keyof IQueryKeys> = ["list", "many", "detail"];
const NO_FILTERS: ReadonlyArray<FilterDef<never>> = [];

interface Conversions<TRecord, TForm, TVariables> {
  toFormValues?: (record: TRecord) => TForm;
  toVariables?: (values: TForm, context: FormConversionContext<TRecord>) => TVariables;
}

/** Applies Refine `HttpError.errors` to matching form fields. */
function applyServerErrors(form: FormInstance, error: unknown) {
  const errors = (error as Partial<HttpError> | undefined)?.errors;
  if (!errors) return;
  form.setFields(
    Object.entries(errors).flatMap(([name, value]) => {
      const messages =
        typeof value === "string" ? [value] : Array.isArray(value) ? value : typeof value === "object" ? [value.message] : [];
      return messages.length ? [{ name, errors: messages }] : [];
    }),
  );
}

/**
 * Connects a resource config to Refine: list query, pagination, sorting, filter translation,
 * drawer state, record loading, mutations, delete confirmation and invalidation.
 * Refine owns server state; this hook holds only UI state (drawer, pending delete, saving).
 */
export function useResourceController<TRecord, TForm = TRecord, TVariables = Partial<TRecord>>(
  config: ResourceConfig<TRecord, TForm, TVariables>,
  options: ResourceControllerOptions<TRecord> = {},
): ResourceController<TRecord, TForm> {
  const { dataProviderName, meta, syncWithLocation = false, invalidates = DEFAULT_INVALIDATES, onSaved, onDeleted } = options;
  const resource = config.name;
  const recordKey = config.recordKey ?? "id";
  const filterDefs = (config.table.filters ?? NO_FILTERS) as ReadonlyArray<FilterDef<TRecord>>;
  const conversions = config.form as Conversions<TRecord, TForm, TVariables>;

  const getRecordId = useCallback(
    (record: TRecord) => (record as Record<string, unknown>)[recordKey] as BaseKey,
    [recordKey],
  );

  // List: Refine owns pagination, sorters and filters.
  const table = useTable<BaseRecord, HttpError>({
    resource,
    dataProviderName,
    meta,
    syncWithLocation,
    pagination: { pageSize: config.table.pageSize ?? 10 },
    sorters: { initial: config.table.initialSorters as CrudSort[] | undefined },
  });
  const { setFilters, setSorters, setCurrentPage, setPageSize } = table;
  const records = table.result.data as unknown as TRecord[];

  const filterValues = useMemo(() => fromRefineFilters(filterDefs, table.filters), [filterDefs, table.filters]);
  const onFilterValuesChange = useCallback(
    (next: FilterValues) => {
      setFilters(toRefineFilters(filterDefs, next), "replace");
      setCurrentPage(1);
    },
    [filterDefs, setFilters, setCurrentPage],
  );

  const onChange = useCallback<NonNullable<TableProps<TRecord>["onChange"]>>(
    (pagination, _filters, sorter, extra) => {
      if (extra.action === "paginate") {
        if (pagination.current) setCurrentPage(pagination.current);
        if (pagination.pageSize) setPageSize(pagination.pageSize);
      }
      if (extra.action === "sort") {
        setSorters(toRefineSorters(sorter));
        setCurrentPage(1);
      }
    },
    [setCurrentPage, setPageSize, setSorters],
  );

  const sorters = useMemo(() => toSortDefs<TRecord>(table.sorters), [table.sorters]);
  const relations = useMemo(() => tableRelations(config.relations, config.table.columns), [config.relations, config.table.columns]);

  // Drawer: one state for create and edit.
  const drawer = useDrawerState();
  const editId = drawer.state.mode === "edit" ? drawer.state.id : undefined;
  const { query: recordQuery } = useOne<BaseRecord, HttpError>({
    resource,
    id: editId,
    dataProviderName,
    meta,
    queryOptions: { enabled: editId !== undefined },
  });
  const editedRecord = editId !== undefined ? (recordQuery.data?.data as TRecord | undefined) : undefined;
  const recordLoading = editId !== undefined && recordQuery.isLoading;

  const initialValues = useMemo((): Partial<TForm> | undefined => {
    if (drawer.state.mode === "create") return config.form.initialValues;
    if (drawer.state.mode === "edit" && editedRecord) {
      return conversions.toFormValues ? conversions.toFormValues(editedRecord) : (editedRecord as unknown as TForm);
    }
    return undefined;
  }, [drawer.state.mode, editedRecord, config.form.initialValues, conversions]);

  // Mutations. Only `mutateAsync` is used: it is the stable surface across Refine 5 releases.
  const [form] = Form.useForm<TForm>();
  const createMutation = useCreate<BaseRecord, HttpError, TVariables>();
  const updateMutation = useUpdate<BaseRecord, HttpError, TVariables>();
  const deleteMutation = useDelete<BaseRecord, HttpError>();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (values: TForm) => {
      const state = drawer.state;
      if (state.mode === "closed") return;
      const context: FormConversionContext<TRecord> = { mode: state.mode, record: editedRecord };
      const variables = conversions.toVariables
        ? conversions.toVariables(values, context)
        : (values as unknown as TVariables);
      setSaving(true);
      try {
        const response =
          state.mode === "create"
            ? await createMutation.mutateAsync({ resource, values: variables, dataProviderName, meta, invalidates })
            : await updateMutation.mutateAsync({ resource, id: state.id, values: variables, dataProviderName, meta, invalidates });
        drawer.close();
        onSaved?.(state.mode, response.data as unknown as TRecord | undefined);
      } catch (error) {
        // Refine reports the error through the host's notification provider; keep the drawer open.
        applyServerErrors(form, error);
      } finally {
        setSaving(false);
      }
    },
    [drawer, editedRecord, conversions, createMutation, updateMutation, resource, dataProviderName, meta, invalidates, form, onSaved],
  );

  // Delete confirmation.
  const [deleteTarget, setDeleteTarget] = useState<TRecord | null>(null);
  const requestDelete = useCallback((record: TRecord) => setDeleteTarget(() => record), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = getRecordId(deleteTarget);
    try {
      await deleteMutation.mutateAsync({ resource, id, dataProviderName, meta, invalidates });
      if (editId !== undefined && editId === String(id)) drawer.close();
      setDeleteTarget(null);
      onDeleted?.(deleteTarget);
    } catch {
      // Reported by Refine; the dialog stays open so the user can retry or cancel.
    }
  }, [deleteTarget, getRecordId, deleteMutation, resource, dataProviderName, meta, invalidates, editId, drawer, onDeleted]);

  const edit = useCallback((record: TRecord) => drawer.openEdit(getRecordId(record)), [drawer, getRecordId]);

  return {
    records,
    relations,
    getRecordId,
    tableProps: {
      columns: config.table.columns,
      dataSource: records,
      rowKey: recordKey,
      loading: table.tableQuery.isFetching,
      pagination: {
        current: table.currentPage,
        pageSize: table.pageSize,
        total: table.result.total,
        showSizeChanger: true,
      },
      onChange,
      sorters,
      filters: filterDefs,
      filterValues,
      onFilterValuesChange,
    },
    drawer,
    edit,
    drawerProps: {
      state: drawer.state,
      labels: config.labels,
      onClose: drawer.close,
      onSubmit: form.submit,
      form,
      loading: recordLoading,
      submitting: saving,
    },
    formProps: {
      form,
      fields: config.form.fields,
      initialValues,
      onFinish: save,
      loading: recordLoading,
    },
    deletion: {
      target: deleteTarget,
      request: requestDelete,
      cancel: cancelDelete,
      confirm: confirmDelete,
      isDeleting: deleteMutation.mutation.isPending,
    },
    editedRecord,
  };
}
