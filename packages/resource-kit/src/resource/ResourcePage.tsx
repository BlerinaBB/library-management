import { Flex } from "antd";
import type { ComponentType, ReactNode } from "react";
import { columns } from "../columns/createColumnFactories";
import { resolveTexts } from "../config/texts";
import type { ResourceTexts } from "../config/texts";
import type { ResourceDrawerProps } from "../drawer/ResourceDrawer";
import { ResourceDrawer } from "../drawer/ResourceDrawer";
import { ResourceForm } from "../form/ResourceForm";
import type { ResourceController, ResourceControllerOptions } from "../hooks/useResourceController";
import { useResourceController } from "../hooks/useResourceController";
import { composeHandlers } from "../table/composeHandlers";
import { DataTable } from "../table/DataTable";
import type { DataTableProps } from "../table/DataTable";
import type { RowAction } from "../types/column";
import type { RelationSelectProps } from "../types/relation";
import type { ResourceConfig } from "../types/resource";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { RefineRelationSelect } from "./RefineRelationSelect";
import { RelationResolver } from "./RelationResolver";
import { ResourceHeader } from "./ResourceHeader";

export interface ResourcePageProps<TRecord, TForm, TVariables> {
  config: ResourceConfig<TRecord, TForm, TVariables>;
  controllerOptions?: ResourceControllerOptions<TRecord>;
  texts?: Partial<ResourceTexts>;
  /** Wraps or replaces the default heading and create button. */
  renderHeader?: (defaultHeader: ReactNode, controller: ResourceController<TRecord, TForm>) => ReactNode;
  /** Content between the header and the table, e.g. a summary. */
  renderBeforeTable?: (controller: ResourceController<TRecord, TForm>) => ReactNode;
  /** Adjusts row actions. Receives the default edit and delete actions. */
  rowActions?: (
    record: TRecord,
    defaults: RowAction<TRecord>[],
    controller: ResourceController<TRecord, TForm>,
  ) => ReadonlyArray<RowAction<TRecord>>;
  /** Extra table props. Handlers are composed with the controller's, not replaced. */
  tableProps?: Omit<Partial<DataTableProps<TRecord>>, "columns" | "dataSource">;
  drawerProps?: Partial<Omit<ResourceDrawerProps, "state" | "children">>;
  /** Component for relation filters and fields. Defaults to `RefineRelationSelect`. */
  relationSelect?: ComponentType<RelationSelectProps>;
}

/**
 * Standard resource screen: heading, create action, filters, table with row actions,
 * create/edit drawer and delete confirmation. Every part is exported for custom layouts.
 */
export function ResourcePage<TRecord, TForm = TRecord, TVariables = Partial<TRecord>>({
  config,
  controllerOptions,
  texts: textOverrides,
  renderHeader,
  renderBeforeTable,
  rowActions,
  tableProps,
  drawerProps,
  relationSelect = RefineRelationSelect,
}: ResourcePageProps<TRecord, TForm, TVariables>) {
  const controller = useResourceController(config, controllerOptions);
  const texts = resolveTexts(textOverrides);
  const { edit, deletion } = controller;

  // Rebuilt each render (cheap) so `rowActions` always sees the current controller.
  const actionsColumn = columns.actions<TRecord>({
    title: texts.actionsTitle,
    actions: (record) => {
      const defaults: RowAction<TRecord>[] = [
        { key: "edit", label: texts.editAction, onClick: edit },
        { key: "delete", label: texts.deleteAction, danger: true, onClick: deletion.request },
      ];
      return rowActions ? rowActions(record, defaults, controller) : defaults;
    },
  });

  const header = <ResourceHeader title={config.labels.plural} createLabel={texts.create(config.labels.singular)} onCreate={controller.drawer.openCreate} />;

  return (
    <Flex vertical gap="large">
      {renderHeader ? renderHeader(header, controller) : header}
      {renderBeforeTable?.(controller)}
      <RelationResolver relations={controller.relations} records={controller.records} dataProviderName={controllerOptions?.dataProviderName}>
        {(relationData) => (
          <DataTable<TRecord>
            scroll={{ x: "max-content" }}
            anyLabel={texts.any}
            relationSelect={relationSelect}
            {...controller.tableProps}
            {...tableProps}
            columns={[...controller.tableProps.columns, actionsColumn]}
            relationData={relationData}
            onChange={composeHandlers(controller.tableProps.onChange, tableProps?.onChange)}
            onFilterValuesChange={composeHandlers(controller.tableProps.onFilterValuesChange, tableProps?.onFilterValuesChange)}
          />
        )}
      </RelationResolver>
      <ResourceDrawer {...controller.drawerProps} texts={textOverrides} {...drawerProps}>
        <ResourceForm<TForm> {...controller.formProps} relationSelect={relationSelect} />
      </ResourceDrawer>
      <DeleteConfirmModal
        open={deletion.target !== null}
        singular={config.labels.singular}
        confirming={deletion.isDeleting}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
        texts={textOverrides}
      />
    </Flex>
  );
}
