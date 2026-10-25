import { useCallback, useMemo, useState } from "react";
import type { DrawerState } from "../types/drawer";
import type { RecordId } from "../types/keys";

const CLOSED: DrawerState = { mode: "closed" };

export interface DrawerStateApi {
  state: DrawerState;
  openCreate: () => void;
  openEdit: (id: RecordId) => void;
  close: () => void;
}

/** Holds the single drawer state. Usable without Refine. */
export function useDrawerState(initial: DrawerState = CLOSED): DrawerStateApi {
  const [state, setState] = useState<DrawerState>(initial);
  const openCreate = useCallback(() => setState({ mode: "create" }), []);
  const openEdit = useCallback((id: RecordId) => setState({ mode: "edit", id: String(id) }), []);
  const close = useCallback(() => setState(CLOSED), []);
  return useMemo(() => ({ state, openCreate, openEdit, close }), [state, openCreate, openEdit, close]);
}
