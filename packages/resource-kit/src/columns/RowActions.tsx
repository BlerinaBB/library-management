import { Button, Flex } from "antd";
import type { RowAction } from "../types/column";

export interface RowActionsProps<T> {
  record: T;
  actions: ReadonlyArray<RowAction<T>>;
}

export function RowActions<T>({ record, actions }: RowActionsProps<T>) {
  return (
    <Flex gap={4} wrap>
      {actions.map((action) => (
        <Button
          key={action.key}
          type="link"
          size="small"
          danger={action.danger}
          disabled={action.disabled}
          onClick={(event) => {
            // Row actions must not trigger row-level click handlers supplied through `onRow`.
            event.stopPropagation();
            action.onClick(record);
          }}
        >
          {action.label}
        </Button>
      ))}
    </Flex>
  );
}
