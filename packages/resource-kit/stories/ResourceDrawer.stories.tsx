import { ResourceDrawer, ResourceForm, useDrawerState } from "@library/resource-kit";
import type { DrawerState, ResourceDrawerProps } from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Button, Flex, Form } from "antd";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { StaticRelationSelect } from "./fixtures/StaticRelationSelect";
import { BOOKS, bookConfig } from "./fixtures/library";
import type { BookFormValues } from "./fixtures/library";

interface DemoArgs {
  /** Drawer state to open with. */
  initial: DrawerState;
  /** Simulated: the edited record is still loading. */
  recordLoading?: boolean;
  /** Simulated: a save is in flight. */
  submitting?: boolean;
  /** Simulated: saving fails with this message. */
  failWith?: string;
}

const record = BOOKS[4]!;

/**
 * The drawer only presents and manages the form lifecycle; this harness plays the
 * controller's role with local state, so no Refine or API is involved.
 */
function DrawerDemo({ initial, recordLoading = false, submitting = false, failWith }: DemoArgs) {
  const drawer = useDrawerState(initial);
  const [form] = Form.useForm<BookFormValues>();
  const [saving, setSaving] = useState(submitting);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<string>();

  const initialValues =
    drawer.state.mode === "create"
      ? bookConfig.form.initialValues
      : drawer.state.mode === "edit" && !recordLoading
        ? bookConfig.form.toFormValues(record)
        : undefined;

  const save = async (values: BookFormValues) => {
    setSaving(true);
    setError(undefined);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSaving(false);
    if (failWith) {
      setError(failWith); // the drawer stays open and keeps the entered values
      return;
    }
    setSaved(values.title);
    drawer.close();
  };

  return (
    <Flex vertical gap="small" align="start">
      <Flex gap="small">
        <Button onClick={drawer.openCreate}>Open create</Button>
        <Button onClick={() => drawer.openEdit(record.id)}>Open edit</Button>
      </Flex>
      {saved && <Alert type="success" title={`Saved “${saved}”`} />}
      <ResourceDrawer
        state={drawer.state}
        labels={bookConfig.labels}
        form={form}
        loading={recordLoading}
        submitting={saving || submitting}
        onClose={() => {
          setError(undefined);
          drawer.close();
        }}
        onSubmit={form.submit}
      >
        {error && <Alert type="error" showIcon title="Save failed" description={error} style={{ marginBottom: 16 }} />}
        <ResourceForm<BookFormValues>
          form={form}
          fields={bookConfig.form.fields}
          initialValues={initialValues}
          resetKey={`${drawer.state.mode}|${recordLoading}`}
          loading={recordLoading}
          onFinish={save}
          relationSelect={StaticRelationSelect}
        />
      </ResourceDrawer>
    </Flex>
  );
}

const meta = {
  title: "Components/ResourceDrawer",
  component: ResourceDrawer,
  render: (_args, context) => <DrawerDemo {...(context.parameters.demo as DemoArgs)} />,
  args: { state: { mode: "closed" }, labels: bookConfig.labels, onClose: () => {}, onSubmit: () => {}, children: null },
  parameters: {
    docs: {
      description: {
        component:
          "One drawer for create and edit, driven by a single `DrawerState`. It renders the mode-specific title " +
          "and save/cancel footer, blocks closing while `submitting`, and resets the given `form` when it opens or " +
          "switches record. Data loading and saving belong to the caller (usually `useResourceController`).",
      },
      story: { inline: false, iframeHeight: 640 },
    },
  },
} satisfies Meta<ResourceDrawerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = { parameters: { demo: { initial: { mode: "create" } } } };

export const EditPrefilled: Story = {
  parameters: { demo: { initial: { mode: "edit", id: record.id } } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByLabelText("Title")).toHaveValue(record.title));
  },
};

export const LoadingRecord: Story = {
  parameters: {
    demo: { initial: { mode: "edit", id: record.id }, recordLoading: true },
    docs: { description: { story: "Simulated: the record never arrives, so the spinner stays and Save is disabled." } },
  },
};

export const SubmissionInProgress: Story = {
  parameters: {
    demo: { initial: { mode: "edit", id: record.id }, submitting: true },
    docs: { description: { story: "Simulated: `submitting` is pinned on; Save shows a spinner and closing is blocked." } },
  },
};

export const FailedSubmission: Story = {
  parameters: {
    demo: { initial: { mode: "edit", id: record.id }, failWith: "Simulated server error: please try again." },
    docs: { description: { story: "Simulated failure: the drawer stays open and the entered values are kept." } },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const title = await body.findByLabelText("Title");
    await waitFor(() => expect(title).toHaveValue(record.title));
    await userEvent.clear(title);
    await userEvent.type(title, "Edited but not saved");
    await userEvent.click(body.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(body.getByText("Simulated server error: please try again.")).toBeInTheDocument());
    await expect(body.getByLabelText("Title")).toHaveValue("Edited but not saved");
    await expect(body.getByRole("dialog")).toBeVisible();
  },
};
