import { Button, Flex, Typography } from "antd";
import type { ReactNode } from "react";

export interface ResourceHeaderProps {
  title: ReactNode;
  createLabel: ReactNode;
  onCreate?: () => void;
  /** Rendered before the create button. */
  extra?: ReactNode;
}

export function ResourceHeader({ title, createLabel, onCreate, extra }: ResourceHeaderProps) {
  return (
    <Flex justify="space-between" align="center" gap="middle" wrap>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      <Flex gap="small">
        {extra}
        {onCreate && (
          <Button type="primary" onClick={onCreate}>
            {createLabel}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
