// @vitest-environment jsdom
// Runs the play functions of interactive stories (portable stories) in jsdom, so the
// interaction checks are part of `npm test`. They also run in Storybook's UI.
import { composeStories } from "@storybook/react";
import { describe, it } from "vitest";
import * as DataTableStories from "../stories/DataTable.stories";
import * as ResourceDrawerStories from "../stories/ResourceDrawer.stories";
import * as ResourceFormStories from "../stories/ResourceForm.stories";
import * as ResourcePageStories from "../stories/ResourcePage.stories";

const { ControlledFilters } = composeStories(DataTableStories);
const { Validation, DateTransformations } = composeStories(ResourceFormStories);
const { EditPrefilled, FailedSubmission } = composeStories(ResourceDrawerStories);
const { Authors, DeleteLastRowOfLastPage, RelationFilterSearchResets } = composeStories(ResourcePageStories);

// No manual DOM cleanup: each `run()` unmounts the previous story first. Wiping
// `document.body` underneath React makes that unmount fail.

describe("story interactions", () => {
  it("DataTable: a false filter value applies, then reset clears it", () => ControlledFilters.run());
  it("ResourceForm: required fields block submit", () => Validation.run());
  it("ResourceForm: API date → form → API date round-trips unchanged", () => DateTransformations.run());
  it("ResourceDrawer: edit opens prefilled", () => EditPrefilled.run());
  it("ResourceDrawer: failed save keeps the drawer open with entered values", () => FailedSubmission.run());
  it("ResourcePage: drawer submission creates a record that appears in the table", () => Authors.run());
  it("ResourcePage: deleting the only row of the last page moves to the new last page", () => DeleteLastRowOfLastPage.run());
  it("RefineRelationSelect: clearing the relation filter restores the default options", () => RelationFilterSearchResets.run());
});
