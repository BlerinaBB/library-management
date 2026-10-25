import { Modal } from "antd";
import type { ReactNode } from "react";
import { resolveTexts } from "../config/texts";
import type { ResourceTexts } from "../config/texts";

export interface DeleteConfirmModalProps {
  open: boolean;
  singular: string;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Overrides the default body text, e.g. to name the record. */
  content?: ReactNode;
  texts?: Partial<ResourceTexts>;
}

/** Controlled delete confirmation. State lives with the caller (see `useResourceController().deletion`). */
export function DeleteConfirmModal({ open, singular, confirming, onConfirm, onCancel, content, texts: overrides }: DeleteConfirmModalProps) {
  const texts = resolveTexts(overrides);
  return (
    <Modal
      open={open}
      title={texts.deleteTitle(singular)}
      okText={texts.confirmDelete}
      cancelText={texts.cancel}
      okButtonProps={{ danger: true, loading: confirming }}
      cancelButtonProps={{ disabled: confirming }}
      onOk={onConfirm}
      onCancel={() => {
        if (!confirming) onCancel();
      }}
    >
      {content ?? texts.deleteContent}
    </Modal>
  );
}
