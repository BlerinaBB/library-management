import {
  columns,
  DataTable,
  DeleteConfirmModal,
  RefineRelationSelect,
  RelationResolver,
  ResourceDrawer,
  ResourceForm,
  useResourceController,
} from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, Flex, Statistic } from "antd";
import { withRefine } from "./fixtures/withRefine";
import { bookConfig } from "./fixtures/library";
import type { Book } from "./fixtures/library";

/**
 * A custom inventory screen built from the lower-level pieces instead of `ResourcePage`:
 * the same controller, table, drawer and form, arranged differently and with custom actions.
 */
function InventoryScreen() {
  const controller = useResourceController(bookConfig);
  const { records, tableProps, drawerProps, formProps, deletion } = controller;
  const inStock = records.filter((book) => book.inStock).length;
  const stockValue = records.filter((book) => book.inStock).reduce((sum, book) => sum + book.price, 0);

  const actions = columns.actions<Book>({
    actions: (book) => [
      { key: "edit", label: "Restock", onClick: controller.edit },
      { key: "remove", label: "Remove", danger: true, onClick: deletion.request, disabled: book.inStock },
    ],
  });

  return (
    <Flex vertical gap="middle">
      <Flex gap="middle" wrap>
        <Card size="small">
          <Statistic title="In stock on this page" value={inStock} suffix={`/ ${records.length}`} />
        </Card>
        <Card size="small">
          <Statistic title="Stock value on this page" value={stockValue} precision={2} prefix="€" />
        </Card>
      </Flex>
      <RelationResolver relations={controller.relations} records={records}>
        {(relationData) => (
          <DataTable<Book>
            {...tableProps}
            columns={[...tableProps.columns, actions]}
            relationData={relationData}
            relationSelect={RefineRelationSelect}
            toolbar={
              <Button type="primary" onClick={controller.drawer.openCreate}>
                Add book
              </Button>
            }
          />
        )}
      </RelationResolver>
      <ResourceDrawer {...drawerProps}>
        <ResourceForm {...formProps} relationSelect={RefineRelationSelect} />
      </ResourceDrawer>
      <DeleteConfirmModal
        open={deletion.target !== null}
        singular="book"
        content={deletion.target ? `Remove “${deletion.target.title}” from the catalogue?` : null}
        confirming={deletion.isDeleting}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </Flex>
  );
}

const meta = {
  title: "Composition/Custom screen",
  component: InventoryScreen,
  decorators: [withRefine],
  parameters: {
    docs: {
      description: {
        component:
          "Composition without `ResourcePage`: `useResourceController` provides props for `DataTable`, " +
          "`ResourceDrawer`, `ResourceForm` and the delete flow; the screen adds a summary, its own toolbar and " +
          "custom row actions (here, a screen-specific rule that only out-of-stock books can be removed).",
      },
    },
  },
} satisfies Meta<typeof InventoryScreen>;

export default meta;

export const Inventory: StoryObj<typeof meta> = {};
