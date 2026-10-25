import {
  PENDING_LOOKUP,
  buildRelationLookup,
  columns,
  createColumnFactories,
  DataTable,
  defineRelation,
  relationKey,
} from "@library/resource-kit";
import type { RelationData } from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flex, Typography } from "antd";
import { fn } from "storybook/test";
import { AUTHORS, GENRES, uuid } from "./fixtures/library";
import type { Author, Genre } from "./fixtures/library";

/** A record exercising every factory, including false, zero and missing values. */
interface Sample {
  id: string;
  label: string;
  note: string | null;
  date: string | null;
  flag: boolean | null;
  count: number | null;
  amount: number | null;
  genre: Genre | null;
  authorId: string | null;
}

const MISSING_AUTHOR = uuid(1, 999);

const SAMPLES: Sample[] = [
  { id: uuid(3, 1), label: "Typical values", note: "A long note that is truncated to one line and shown in full in a tooltip on hover.", date: "2024-02-29", flag: true, count: 1234.5, amount: 19.99, genre: "poetry", authorId: AUTHORS[0]!.id },
  { id: uuid(3, 2), label: "False and zero", note: "", date: "1970-01-01", flag: false, count: 0, amount: 0, genre: "fiction", authorId: AUTHORS[1]!.id },
  { id: uuid(3, 3), label: "Missing values", note: null, date: null, flag: null, count: null, amount: null, genre: null, authorId: null },
  { id: uuid(3, 4), label: "Missing reference", note: "Author id points to a deleted record.", date: "not-a-date", flag: true, count: -3, amount: -5, genre: "science", authorId: MISSING_AUTHOR },
];

const sampleAuthor = defineRelation<Sample, Author>({ resource: "authors", foreignKey: "authorId", valueField: "id", labelField: "name" });

// Bind formatting defaults once (e.g. per app), and override per column where needed.
const gb = createColumnFactories({ locale: "en-GB", currency: "GBP", emptyText: "—" });

const allColumns = [
  gb.id<Sample>("id", { width: 110, ellipsis: true }),
  gb.text<Sample>("label"),
  gb.longText<Sample>("note", { lines: 1, width: 200 }),
  gb.date<Sample>("date"),
  gb.boolean<Sample>("flag"),
  gb.number<Sample>("count"),
  gb.money<Sample>("amount", { title: "Amount (GBP)" }),
  gb.money<Sample>("amount", { key: "amountEur", title: "Amount (EUR, de-DE)", format: { currency: "EUR", locale: "de-DE" } }),
  gb.money<Sample>("amount", { key: "amountJpy", title: "Amount (JPY)", format: { currency: "JPY", locale: "ja-JP" } }),
  gb.enum<Sample, "genre">("genre", { options: GENRES }),
  gb.relation<Sample>(sampleAuthor, {
    title: "Author",
    renderMissing: (id) => <Typography.Text type="danger">Unknown author ({String(id).slice(0, 8)}…)</Typography.Text>,
  }),
  gb.actions<Sample>({ actions: (row) => [{ key: "inspect", label: "Inspect", onClick: fn().mockName(`inspect ${row.label}`) }] }),
];

const resolved: RelationData = { [relationKey(sampleAuthor)]: buildRelationLookup(sampleAuthor, AUTHORS) };

const meta = {
  title: "Columns/Column factories",
  parameters: {
    docs: {
      description: {
        component:
          "Pure factories returning Ant Design column definitions. `false` and `0` render as values; `null`, " +
          "`undefined` and `\"\"` render the empty text. Relation columns render from resolved data " +
          "(`RelationData`) and never fetch. Key arguments are type-checked: money and number columns accept numeric " +
          "fields, boolean columns boolean fields, enum options must match the field's union.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => (
    <DataTable<Sample> rowKey="id" columns={allColumns} dataSource={SAMPLES} relationData={resolved} pagination={false} scroll={{ x: "max-content" }} />
  ),
};

export const RelationStates: Story = {
  render: () => {
    const relationColumns = [columns.text<Sample>("label"), columns.relation<Sample>(sampleAuthor, { title: "Author" })];
    const rows = SAMPLES.filter((s) => s.authorId);
    return (
      <Flex vertical gap="large">
        {(
          [
            ["Resolved (from RelationResolver or your own lookup)", resolved],
            ["Pending (related records still loading)", { [relationKey(sampleAuthor)]: PENDING_LOOKUP }],
            ["Unresolved (no relation data passed): raw keys", undefined],
          ] as const
        ).map(([title, data]) => (
          <Flex key={title} vertical gap="small">
            <Typography.Title level={5}>{title}</Typography.Title>
            <DataTable<Sample> rowKey="id" columns={relationColumns} dataSource={rows} relationData={data} pagination={false} />
          </Flex>
        ))}
      </Flex>
    );
  },
};
