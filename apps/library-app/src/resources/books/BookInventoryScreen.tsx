import {
  DataTable,
  RefineRelationSelect,
  RelationResolver,
  ResourceDrawer,
  ResourceForm,
  useResourceController,
} from "@library/resource-kit";
import { Button, Flex, Statistic } from "antd";
import { columns } from "../formatting";
import { bookConfig } from "./book.config";
import type { Book } from "./book.types";

/** Custom layout built from the kit's pieces instead of `ResourcePage`. */
export function BookInventoryScreen() {
  const controller = useResourceController(bookConfig);
  const { records, tableProps, drawerProps, formProps } = controller;
  const inStock = records.filter((book) => book.inStock).length;

  const actions = columns.actions<Book>({
    actions: () => [{ key: "edit", label: "Restock", onClick: controller.edit }],
  });

  return (
    <Flex vertical gap="large">
      <Flex justify="space-between" align="center">
        <Statistic title="In stock on this page" value={inStock} suffix={`/ ${records.length}`} />
        <Button type="primary" onClick={controller.drawer.openCreate}>
          Add book
        </Button>
      </Flex>
      <RelationResolver relations={controller.relations} records={records}>
        {(relationData) => (
          <DataTable<Book>
            {...tableProps}
            columns={[...tableProps.columns, actions]}
            relationData={relationData}
            relationSelect={RefineRelationSelect}
          />
        )}
      </RelationResolver>
      <ResourceDrawer {...drawerProps}>
        <ResourceForm {...formProps} relationSelect={RefineRelationSelect} />
      </ResourceDrawer>
    </Flex>
  );
}
