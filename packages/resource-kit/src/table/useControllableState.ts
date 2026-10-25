import { useCallback, useState } from "react";

/**
 * Controlled when `value` is provided, uncontrolled otherwise.
 * `onChange` is always called, so consumers can observe changes in both modes.
 */
export function useControllableState<V>(
  value: V | undefined,
  defaultValue: V,
  onChange?: (next: V) => void,
): [V, (next: V) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const setValue = useCallback(
    (next: V) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? value : internal, setValue];
}
