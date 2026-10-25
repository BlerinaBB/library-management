import type { Preview } from "@storybook/react-vite";
import { App, ConfigProvider } from "antd";

// Ant Design context every story needs. Refine is added per story (see stories/fixtures/withRefine.tsx),
// so presentation-component stories prove they work without it.
const preview: Preview = {
  decorators: [
    (Story) => (
      <ConfigProvider theme={{ token: { borderRadius: 6 } }}>
        <App>
          <div style={{ padding: 16 }}>
            <Story />
          </div>
        </App>
      </ConfigProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: {
      storySort: {
        order: ["Guide", ["Overview", "Configuration", "Recipes"], "Components", "Columns", "Composition"],
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
