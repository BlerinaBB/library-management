import type { NotificationProvider } from "@refinedev/core";
import { App, Button } from "antd";

/**
 * Refine notification provider backed by Ant Design 6's `App.useApp()`.
 *
 * `@refinedev/antd` ships an equivalent, but its current release (6.0.x) declares
 * `antd ^5` as a peer and cannot be installed next to antd 6. Refine calls this
 * hook inside `<Refine>`, so it must render below antd's `<App>`.
 */
export function useNotificationProvider(): NotificationProvider {
  const { notification } = App.useApp();
  return {
    open: ({ key, message, description, type, cancelMutation, undoableTimeout }) => {
      if (type === "progress") {
        notification.info({
          key,
          title: message,
          description,
          duration: undoableTimeout,
          actions: cancelMutation ? (
            <Button
              size="small"
              onClick={() => {
                cancelMutation();
                if (key) notification.destroy(key);
              }}
            >
              Undo
            </Button>
          ) : undefined,
        });
        return;
      }
      notification[type]({ key, title: message, description });
    },
    close: (key) => notification.destroy(key),
  };
}
