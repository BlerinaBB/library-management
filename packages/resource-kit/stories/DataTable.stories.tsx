import { buildRelationLookup, columns, DataTable, filters, relationKey } from "@library/resource-kit";
import type { DataTableProps, FilterDef, FilterValues } from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Flex, Typography } from "antd";
import { useMemo, useState } from "react";
import type { Key } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { StaticRelationSelect } from "./fixtures/StaticRelationSelect";
import { AUTHORS, BOOKS, GENRES, bookAuthor } from "./fixtures/library";
import type { Book } from "./fixtures/library";

// DataTable is Refine-independent: these stories pass plain arrays and pre-resolved relation data.
const relationData = { [relationKey(bookAuthor)]: buildRelationLookup(bookAuthor, AUTHORS) };

const bookColumns = [
  columns.text<Book>("title", { sortable: true }),
  columns.relation<Book>(bookAuthor, { title: "Author" }),
  columns.enum<Book, "genre">("genre", { options: GENRES }),
  columns.money<Book>("price", { format: { currency: "EUR", locale: "en-GB" } }),
  columns.boolean<Book>("inStock", { title: "In stock" }),
];

const meta = {
  title: "Components/DataTable",
  component: DataTable<Book>,
  args: {
    columns: bookColumns,
    dataSource: BOOKS.slice(0, 5),
    relationData,
    rowKey: "id",
    pagination: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Ant Design `Table` plus typed column factories and an optional filter bar. Accepts every `Table` prop " +
          "(pagination, sorting, selection, scroll, `onRow`, …) and forwards them unchanged. It renders filter " +
          "controls and emits values; applying them (locally or through Refine) is the caller's job.",
      },
    },
  },
} satisfies Meta<DataTableProps<Book>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Loading: Story = {
  args: { loading: true, dataSource: [] },
  parameters: { docs: { description: { story: "Simulated: `loading` is set explicitly; no request is made." } } },
};

export const Empty: Story = { args: { dataSource: [] } };

function ControlledPaginationDemo(args: DataTableProps<Book>) {
  const [page, setPage] = useState({ current: 1, pageSize: 5 });
  const rows = BOOKS.slice((page.current - 1) * page.pageSize, page.current * page.pageSize);
  return (
    <Flex vertical gap="small">
      <Typography.Text type="secondary">
        Page {page.current}, {page.pageSize} per page (state owned by the story)
      </Typography.Text>
      <DataTable<Book>
        {...args}
        dataSource={rows}
        pagination={{ ...page, total: BOOKS.length, showSizeChanger: true, pageSizeOptions: [5, 10] }}
        onChange={(pagination) => setPage({ current: pagination.current ?? 1, pageSize: pagination.pageSize ?? 5 })}
      />
    </Flex>
  );
}

export const ControlledPagination: Story = { render: (args) => <ControlledPaginationDemo {...args} /> };

function RowSelectionDemo(args: DataTableProps<Book>) {
  const [selected, setSelected] = useState<Key[]>([]);
  return (
    <Flex vertical gap="small">
      <Typography.Text>{selected.length} selected</Typography.Text>
      <DataTable<Book> {...args} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }} />
    </Flex>
  );
}

export const RowSelection: Story = { render: (args) => <RowSelectionDemo {...args} /> };

export const ColumnCustomization: Story = {
  args: {
    columns: [
      columns.text<Book>("title", { title: "Book", width: 260, fixed: "left" }),
      columns.relation<Book>(bookAuthor, {
        title: "Written by",
        renderRelated: (author) => <Typography.Text strong>{author.name}</Typography.Text>,
      }),
      columns.money<Book>("price", { title: "Price (USD)", format: { currency: "USD", locale: "en-US" } }),
      columns.boolean<Book>("inStock", {
        title: "Availability",
        format: { booleanLabels: { true: "Available", false: "Sold out" } },
      }),
      columns.actions<Book>({ actions: (book) => [{ key: "open", label: "Open", onClick: fn().mockName(`open ${book.title}`) }] }),
    ],
    scroll: { x: "max-content" },
  },
  parameters: {
    docs: { description: { story: "Every option is a normal Ant Design column prop, applied after the factory defaults." } },
  },
};

const bookFilters: FilterDef<Book>[] = [
  filters.text<Book>("title"),
  filters.relation<Book>(bookAuthor, { label: "Author", multiple: true }),
  filters.enum<Book, "genre">("genre", { options: GENRES, multiple: true }),
  filters.boolean<Book>("inStock", { label: "In stock" }),
];

/** Local filtering for the story; with Refine, `useResourceController` sends the same values to the API. */
function applyFilters(rows: Book[], values: FilterValues): Book[] {
  return rows.filter((book) =>
    bookFilters.every((filter) => {
      const value = values[filter.key];
      if (value === undefined) return true;
      const actual = book[filter.field as keyof Book];
      if (Array.isArray(value)) return value.includes(actual as string);
      if (filter.operator === "contains") return String(actual).toLowerCase().includes(String(value).toLowerCase());
      return actual === value;
    }),
  );
}

function ControlledFiltersDemo(args: DataTableProps<Book>) {
  const [values, setValues] = useState<FilterValues>({});
  const rows = useMemo(() => applyFilters(BOOKS, values), [values]);
  return (
    <Flex vertical gap="small">
      <DataTable<Book>
        {...args}
        dataSource={rows}
        filters={bookFilters}
        filterValues={values}
        onFilterValuesChange={(next) => {
          setValues(next);
          args.onFilterValuesChange?.(next);
        }}
        relationSelect={StaticRelationSelect}
        toolbar={
          <Button onClick={() => setValues({})} disabled={Object.keys(values).length === 0}>
            Reset filters
          </Button>
        }
      />
      <Typography.Text type="secondary" data-testid="filter-state">
        {JSON.stringify(values)}
      </Typography.Text>
    </Flex>
  );
}

export const ControlledFilters: Story = {
  args: { onFilterValuesChange: fn() },
  render: (args) => <ControlledFiltersDemo {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const rowCount = () => canvasElement.querySelectorAll("tr.ant-table-row").length;
    await waitFor(() => expect(rowCount()).toBe(BOOKS.length));

    // `false` is a real filter value: choose "No" for In stock.
    // Comboboxes in order: Author, Genre, In stock.
    const [, , inStock] = canvas.getAllByRole("combobox");
    await userEvent.click(inStock!);
    await userEvent.click(await page.findByTitle("No"));
    await waitFor(() => expect(canvas.getByTestId("filter-state")).toHaveTextContent('{"inStock":false}'));
    await waitFor(() => expect(rowCount()).toBe(BOOKS.filter((b) => !b.inStock).length));
    await expect(args.onFilterValuesChange).toHaveBeenCalledWith({ inStock: false });

    await userEvent.click(canvas.getByRole("button", { name: "Reset filters" }));
    await waitFor(() => expect(rowCount()).toBe(BOOKS.length));
    await expect(canvas.getByTestId("filter-state")).toHaveTextContent("{}");
  },
};
