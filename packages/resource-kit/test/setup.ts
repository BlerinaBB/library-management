import { setProjectAnnotations } from "@storybook/react";
import preview from "../.storybook/preview";

// Stories run with the same decorators and parameters as in Storybook.
setProjectAnnotations(preview);

// jsdom gaps that Ant Design relies on (only relevant to jsdom test files).
if (typeof window !== "undefined") {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  // jsdom does not implement pseudo-element styles; Ant Design asks for them when measuring scrollbars.
  const getComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = (element: Element) => getComputedStyle(element);
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
