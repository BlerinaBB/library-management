/** Single source of truth for the create/edit drawer. */
export type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: string };

export type OpenDrawerState = Exclude<DrawerState, { mode: "closed" }>;
