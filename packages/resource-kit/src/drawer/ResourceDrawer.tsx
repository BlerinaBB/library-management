import { Button, Drawer, Flex } from "antd";
import type { DrawerProps, FormInstance } from "antd";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { resolveTexts } from "../config/texts";
import type { ResourceTexts } from "../config/texts";
import type { DrawerState, OpenDrawerState } from "../types/drawer";
import { drawerStateKey } from "./useDrawerState";
import type { ResourceLabels } from "../types/resource";

export interface DrawerFooterContext {
  submit: () => void;
  cancel: () => void;
  submitting: boolean;
  loading: boolean;
}

export interface ResourceDrawerProps
  extends Omit<DrawerProps, "open" | "title" | "onClose" | "footer" | "children"> {
  state: DrawerState;
  labels: ResourceLabels;
  onClose: () => void;
  /** Called by the save button. Typically `form.submit`. */
  onSubmit: () => void;
  /** When given, the form is reset each time the drawer opens or switches record. */
  form?: FormInstance;
  /** The edited record is loading. */
  loading?: boolean;
  /** A save is in flight. Closing is blocked meanwhile. */
  submitting?: boolean;
  title?: (state: OpenDrawerState, labels: ResourceLabels) => ReactNode;
  /** Replaces the default cancel/save footer. */
  footer?: (context: DrawerFooterContext) => ReactNode;
  texts?: Partial<ResourceTexts>;
  children: ReactNode;
}

/** One drawer for create and edit. Presentation and form lifecycle only; data operations stay with the caller. */
export function ResourceDrawer({
  state,
  labels,
  onClose,
  onSubmit,
  form,
  loading = false,
  submitting = false,
  title,
  footer,
  texts: textOverrides,
  children,
  size = 520,
  ...drawerProps
}: ResourceDrawerProps) {
  const texts = resolveTexts(textOverrides);
  const open = state.mode !== "closed";
  const key = drawerStateKey(state);

  // Clear leftovers whenever the drawer opens or switches record. Drawer content renders in
  // its own commit, so this can run before the form has received new `initialValues`;
  // `ResourceForm`'s `resetKey` applies them once they arrive (see useResourceController).
  useEffect(() => {
    if (open) form?.resetFields();
  }, [form, open, key]);

  const cancel = () => {
    if (!submitting) onClose();
  };
  const footerContext: DrawerFooterContext = { submit: onSubmit, cancel, submitting, loading };

  return (
    <Drawer
      open={open}
      size={size}
      // Keep the form mounted so the form instance stays connected while closed.
      forceRender
      title={
        state.mode === "closed"
          ? null
          : title
            ? title(state, labels)
            : state.mode === "create"
              ? texts.create(labels.singular)
              : texts.edit(labels.singular)
      }
      onClose={cancel}
      footer={
        footer ? (
          footer(footerContext)
        ) : (
          <Flex justify="end" gap="small">
            <Button onClick={cancel} disabled={submitting}>
              {texts.cancel}
            </Button>
            <Button type="primary" onClick={onSubmit} loading={submitting} disabled={loading}>
              {texts.save}
            </Button>
          </Flex>
        )
      }
      {...drawerProps}
    >
      {children}
    </Drawer>
  );
}
