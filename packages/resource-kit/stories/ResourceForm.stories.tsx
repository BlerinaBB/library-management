import { fields, ResourceForm } from "@library/resource-kit";
import type { FieldDef, ResourceFormProps } from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, Flex, Form, Rate, Typography } from "antd";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { StaticRelationSelect } from "./fixtures/StaticRelationSelect";
import { BOOKS, GENRES, bookAuthor, bookConfig } from "./fixtures/library";
import type { Book, BookFormValues } from "./fixtures/library";

// Every field type in one definition list. `fields.*` infer and check keys against BookFormValues.
const allFields: FieldDef<BookFormValues>[] = [
  fields.text("title", { rules: [{ required: true }] }),
  fields.textarea("isbn", { label: "ISBN (textarea, for the demo)" }),
  fields.date("publishedDate", { label: "Published" }),
  fields.boolean("inStock", { label: "In stock" }),
  fields.number("pageCount", { label: "Pages", props: { min: 1 } }),
  fields.money("price", { currency: "EUR", locale: "en-GB" }),
  fields.enum("genre", { options: GENRES }),
  fields.relation("authorId", bookAuthor, { label: "Author" }),
];

const meta = {
  title: "Components/ResourceForm",
  component: ResourceForm<BookFormValues>,
  args: {
    fields: allFields,
    relationSelect: StaticRelationSelect,
    onFinish: fn(),
  },
  render: (args) => (
    <Card style={{ maxWidth: 520 }}>
      <ResourceForm<BookFormValues> {...args}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </ResourceForm>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component:
          "Renders field definitions inside an Ant Design `Form`. It makes no requests: pass `form`, " +
          "`initialValues` and `onFinish`. Relation fields render the injected `relationSelect` component " +
          "(here a static one, so no Refine is needed). `resetKey` re-applies `initialValues` when it changes.",
      },
    },
  },
} satisfies Meta<ResourceFormProps<BookFormValues>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllFieldTypes: Story = {};

const sample = BOOKS[2]!;

export const InitialValues: Story = {
  args: { initialValues: bookConfig.form.toFormValues(sample), resetKey: sample.id },
};

export const Validation: Story = {
  args: { fields: bookConfig.form.fields },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(canvas.getByText("Please enter Title")).toBeInTheDocument());
    await expect(canvas.getByText("Please enter Author")).toBeInTheDocument();
    await expect(args.onFinish).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByLabelText("Title"), "A valid title");
    await waitFor(() => expect(canvas.queryByText("Please enter Title")).not.toBeInTheDocument());
  },
};

export const Disabled: Story = {
  args: { disabled: true, initialValues: bookConfig.form.toFormValues(sample), resetKey: sample.id },
};

export const Loading: Story = {
  args: { loading: true },
  parameters: { docs: { description: { story: "Simulated: `loading` shows a spinner and disables inputs, e.g. while a record loads." } } },
};

interface ReviewForm {
  title: string;
  rating: number;
}

const reviewFields: FieldDef<ReviewForm>[] = [
  fields.text("title"),
  // `render` receives the field's typed value (number) and onChange from the Form.Item.
  fields.custom("rating", {
    label: "Rating",
    rules: [{ required: true, message: "Pick a rating" }],
    render: ({ value, onChange }) => <Rate value={value} onChange={onChange} />,
  }),
];

export const CustomField: Story = {
  render: (args) => (
    <Card style={{ maxWidth: 520 }}>
      <ResourceForm<ReviewForm>
        fields={reviewFields}
        initialValues={{ title: "Kindred", rating: 4 }}
        resetKey="review"
        onFinish={args.onFinish as (values: ReviewForm) => void}
      >
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </ResourceForm>
    </Card>
  ),
};

/**
 * API records keep dates as `YYYY-MM-DD` strings; the date picker needs `Dayjs`.
 * `toFormValues` / `toVariables` (here from the book config) convert explicitly in both directions.
 */
function DateTransformationsDemo(args: Partial<ResourceFormProps<BookFormValues>>) {
  const [form] = Form.useForm<BookFormValues>();
  const [payload, setPayload] = useState<Omit<Book, "id"> | null>(null);
  const record = BOOKS[0]!;
  return (
    <Flex gap="large" wrap align="start">
      <Card title="1. API record" style={{ width: 280 }}>
        <Typography.Paragraph code>{`publishedDate: "${record.publishedDate}"`}</Typography.Paragraph>
        <Typography.Text type="secondary">toFormValues → Dayjs for the picker</Typography.Text>
      </Card>
      <Card title="2. Form" style={{ width: 420 }}>
        <ResourceForm<BookFormValues>
          {...args}
          form={form}
          fields={bookConfig.form.fields}
          initialValues={bookConfig.form.toFormValues(record)}
          resetKey={record.id}
          onFinish={(values) => setPayload(bookConfig.form.toVariables(values, { mode: "edit", record }))}
        >
          <Button type="primary" htmlType="submit">
            Convert to API payload
          </Button>
        </ResourceForm>
      </Card>
      <Card title="3. Mutation payload" style={{ width: 280 }}>
        <Typography.Paragraph code data-testid="payload-date">
          {payload ? `publishedDate: "${payload.publishedDate}"` : "Submit the form"}
        </Typography.Paragraph>
        <Typography.Text type="secondary">toVariables → date-only string, no timezone shift</Typography.Text>
      </Card>
    </Flex>
  );
}

export const DateTransformations: Story = {
  render: (args) => <DateTransformationsDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Convert to API payload" }));
    await waitFor(() => expect(canvas.getByTestId("payload-date")).toHaveTextContent(`publishedDate: "${BOOKS[0]!.publishedDate}"`));
  },
};

