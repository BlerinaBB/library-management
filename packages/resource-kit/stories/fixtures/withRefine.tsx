import { Refine } from "@refinedev/core";
import type { NotificationProvider } from "@refinedev/core";
import type { Decorator } from "@storybook/react-vite";
import { App } from "antd";
import { useState } from "react";
import type { ReactNode } from "react";
import { createInMemoryDataProvider } from "./inMemoryDataProvider";
import type { InMemoryOptions } from "./inMemoryDataProvider";
import { AUTHORS, BOOKS } from "./library";

/** Story parameter read by `withRefine`: `parameters: { refine: { latencyMs: 600 } }`. */
export type RefineStoryParameters = InMemoryOptions;

function useStoryNotifications(): NotificationProvider {
  const { notification } = App.useApp();
  return {
    open: ({ key, message, description, type }) =>
      notification[type === "progress" ? "info" : type]({ key, title: message, description }),
    close: (key) => notification.destroy(key),
  };
}

function RefineStoryProvider({ options, children }: { options?: RefineStoryParameters; children: ReactNode }) {
  // Created once per mount; the decorator remounts this component for every story.
  const [dataProvider] = useState(() => createInMemoryDataProvider({ authors: AUTHORS, books: BOOKS }, options));
  return (
    <Refine
      dataProvider={dataProvider}
      notificationProvider={useStoryNotifications}
      resources={[{ name: "authors" }, { name: "books" }]}
      options={{ disableTelemetry: true, reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
    >
      {children}
    </Refine>
  );
}

/**
 * Wraps a story in `<Refine>` with an in-memory data provider. Keyed by story id, so the
 * provider's data and Refine's query cache are recreated per story and never leak between stories.
 */
export const withRefine: Decorator = (Story, context) => (
  <RefineStoryProvider key={context.id} options={context.parameters.refine as RefineStoryParameters | undefined}>
    <Story />
  </RefineStoryProvider>
);
