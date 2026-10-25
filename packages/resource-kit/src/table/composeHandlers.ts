/**
 * Combines optional handlers into one that calls each in order.
 * Used wherever the kit wires its own handler next to a consumer-supplied one.
 */
export function composeHandlers<A extends unknown[]>(
  ...handlers: Array<((...args: A) => void) | undefined>
): ((...args: A) => void) | undefined {
  const defined = handlers.filter((handler): handler is (...args: A) => void => typeof handler === "function");
  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];
  return (...args: A) => {
    for (const handler of defined) handler(...args);
  };
}
