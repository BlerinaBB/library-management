import { ResourcePage } from "@library/resource-kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { withRefine } from "./fixtures/withRefine";
import type { RefineStoryParameters } from "./fixtures/withRefine";
import { authorConfig, bookConfig } from "./fixtures/library";

const meta = {
  title: "Composition/ResourcePage",
  component: ResourcePage,
  decorators: [withRefine],
  parameters: {
    docs: {
      description: {
        component:
          "The standard screen: heading, create action, filters, table with row actions, create/edit drawer and " +
          "delete confirmation, composed from the exported pieces and `useResourceController`. Authors and Books " +
          "below differ only in their configuration objects. Data comes from an in-memory Refine data provider " +
          "that is recreated for every story; nothing is sent over the network.",
      },
    },
  },
} satisfies Meta<typeof ResourcePage>;

export default meta;
// Stories render the generic component directly so each config keeps its own record/form types.
type Story = StoryObj;

export const Authors: Story = {
  render: () => <ResourcePage config={authorConfig} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await canvas.findByText("Annie Ernaux");

    // Drawer submission through the controller: create → mutation → invalidation → row appears.
    await userEvent.click(canvas.getByRole("button", { name: "Create Author" }));
    const drawer = within(await body.findByRole("dialog"));
    await userEvent.type(drawer.getByLabelText("Name"), "Aaron Storybook");
    await userEvent.type(drawer.getByLabelText("Nationality"), "Kosovar");
    await userEvent.click(drawer.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByText("Aaron Storybook")).toBeInTheDocument());
  },
};

export const Books: Story = {
  render: () => <ResourcePage config={bookConfig} />,
  parameters: {
    docs: {
      description: {
        story:
          "Author names come from one batched `getMany` per page (relation metadata in the config). The author " +
          "filter and the form's author select reuse the same relation definition.",
      },
    },
  },
};

export const SlowApi: Story = {
  render: () => <ResourcePage config={bookConfig} />,
  parameters: {
    refine: { latencyMs: 1200 } satisfies RefineStoryParameters,
    docs: { description: { story: "Simulated 1.2 s latency on every request to show loading and submitting states." } },
  },
};

export const FailingSaves: Story = {
  render: () => <ResourcePage config={authorConfig} />,
  parameters: {
    refine: { failures: { update: "Simulated: the server rejected the update.", create: "Simulated: the server rejected the create." } } satisfies RefineStoryParameters,
    docs: {
      description: {
        story: "Simulated failures: saves fail with an error notification, and the drawer stays open with the entered values.",
      },
    },
  },
};

const rowCount = (canvasElement: HTMLElement) => canvasElement.querySelectorAll("tr.ant-table-row").length;

/** Regression: deleting the only row of the last page moves to the new last page instead of an empty one. */
export const DeleteLastRowOfLastPage: Story = {
  tags: ["!autodocs"],
  render: () => <ResourcePage config={bookConfig} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    // 16 books at 5 per page: page 4 holds exactly one book.
    await canvas.findByText("Things Fall Apart");
    await userEvent.click(canvas.getByTitle("4"));
    await canvas.findByText("On Earth We're Briefly Gorgeous");
    await waitFor(() => expect(rowCount(canvasElement)).toBe(1));

    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    await userEvent.click(within(await body.findByRole("dialog")).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(canvas.queryByText("On Earth We're Briefly Gorgeous")).not.toBeInTheDocument());
    await waitFor(() => expect(rowCount(canvasElement)).toBe(5));
    await expect(canvasElement.querySelector(".ant-pagination-item-active")).toHaveTextContent("3");
  },
};

/** Regression: clearing a relation filter also clears its server-side search, so reopening shows the default options. */
export const RelationFilterSearchResets: Story = {
  tags: ["!autodocs"],
  render: () => <ResourcePage config={bookConfig} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await canvas.findByText("Things Fall Apart");
    // The first combobox in the filter bar is the Author filter.
    const authorFilter = canvas.getAllByRole("combobox")[0]!;

    // Ocean Vuong is not on the first page of options; find him through the server-side search.
    await userEvent.click(authorFilter);
    await body.findByTitle("Chinua Achebe");
    await userEvent.type(authorFilter, "Vuong");
    await waitFor(() => expect(body.queryByTitle("Chinua Achebe")).not.toBeInTheDocument());
    await userEvent.click(await body.findByTitle("Ocean Vuong"));
    await waitFor(() => expect(rowCount(canvasElement)).toBe(2));

    // Clear the filter, then reopen it: the default options are back, not the last search.
    await userEvent.keyboard("{Escape}");
    const clear = authorFilter.closest(".ant-select")!.querySelector(".ant-select-clear")!;
    await userEvent.click(clear);
    await waitFor(() => expect(rowCount(canvasElement)).toBe(5));
    await userEvent.click(authorFilter);
    await expect(await body.findByTitle("Chinua Achebe", {}, { timeout: 3000 })).toBeInTheDocument();
  },
};
