/** User-facing strings rendered by the kit. Components accept a partial override. */
export interface ResourceTexts {
  create: (singular: string) => string;
  edit: (singular: string) => string;
  save: string;
  cancel: string;
  editAction: string;
  deleteAction: string;
  actionsTitle: string;
  deleteTitle: (singular: string) => string;
  deleteContent: string;
  confirmDelete: string;
  yes: string;
  no: string;
  any: string;
}

export const defaultTexts: ResourceTexts = {
  create: (singular) => `Create ${singular}`,
  edit: (singular) => `Edit ${singular}`,
  save: "Save",
  cancel: "Cancel",
  editAction: "Edit",
  deleteAction: "Delete",
  actionsTitle: "Actions",
  deleteTitle: (singular) => `Delete ${singular}?`,
  deleteContent: "This action cannot be undone.",
  confirmDelete: "Delete",
  yes: "Yes",
  no: "No",
  any: "Any",
};

export function resolveTexts(overrides?: Partial<ResourceTexts>): ResourceTexts {
  return overrides ? { ...defaultTexts, ...overrides } : defaultTexts;
}
