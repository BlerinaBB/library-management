// Isolated Refine data provider for Storybook. Each story gets a fresh copy of the
// fixtures, so mutations never leak between stories and no network is involved.
import type { BaseRecord, CrudFilter, CrudSort, DataProvider, HttpError } from "@refinedev/core";
import { uuid } from "./library";

type Operation = "getList" | "getOne" | "getMany" | "create" | "update" | "deleteOne";

export interface InMemoryOptions {
  /** Simulated latency for every request, to make loading states visible. */
  latencyMs?: number;
  /** Simulated failures: the operation rejects with this message (HTTP 500). */
  failures?: Partial<Record<Operation, string>>;
}

export type Fixtures = Record<string, BaseRecord[]>;

function matches(record: BaseRecord, filter: CrudFilter): boolean {
  if (!("field" in filter)) return true;
  const actual = record[filter.field];
  const expected = filter.value;
  switch (filter.operator) {
    case "eq":
      return String(actual) === String(expected);
    case "ne":
      return String(actual) !== String(expected);
    case "in":
      return [].concat(expected).map(String).includes(String(actual));
    case "nin":
      return ![].concat(expected).map(String).includes(String(actual));
    case "contains":
      return String(actual ?? "").toLowerCase().includes(String(expected).toLowerCase());
    case "startswith":
      return String(actual ?? "").toLowerCase().startsWith(String(expected).toLowerCase());
    case "endswith":
      return String(actual ?? "").toLowerCase().endsWith(String(expected).toLowerCase());
    case "gt":
      return actual > expected;
    case "gte":
      return actual >= expected;
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
    default:
      return true;
  }
}

function compare(a: BaseRecord, b: BaseRecord, sorters: CrudSort[]): number {
  for (const { field, order } of sorters) {
    const left = a[field];
    const right = b[field];
    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""));
    if (result !== 0) return order === "desc" ? -result : result;
  }
  return 0;
}

export function createInMemoryDataProvider(fixtures: Fixtures, options: InMemoryOptions = {}): DataProvider {
  const db: Fixtures = structuredClone(fixtures);
  let created = 0;

  async function run<T>(operation: Operation, work: () => T): Promise<T> {
    if (options.latencyMs) await new Promise((resolve) => setTimeout(resolve, options.latencyMs));
    const failure = options.failures?.[operation];
    if (failure) {
      const error: HttpError = { message: failure, statusCode: 500 };
      throw error;
    }
    return work();
  }

  const table = (resource: string) => (db[resource] ??= []);
  const find = (resource: string, id: unknown) => table(resource).find((record) => String(record.id) === String(id));

  return {
    getApiUrl: () => "memory://",

    getList: ({ resource, filters = [], sorters = [], pagination }) =>
      run("getList", () => {
        const rows = table(resource)
          .filter((record) => filters.every((filter) => matches(record, filter)))
          .sort((a, b) => compare(a, b, sorters));
        const { currentPage = 1, pageSize = 10, mode = "server" } = pagination ?? {};
        const data = mode === "off" ? rows : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return { data: structuredClone(data) as never[], total: rows.length };
      }),

    getMany: ({ resource, ids }) =>
      run("getMany", () => ({
        data: structuredClone(table(resource).filter((record) => ids.map(String).includes(String(record.id)))) as never[],
      })),

    getOne: ({ resource, id }) =>
      run("getOne", () => {
        const record = find(resource, id);
        if (!record) throw { message: `${resource}/${id} not found`, statusCode: 404 } satisfies HttpError;
        return { data: structuredClone(record) as never };
      }),

    create: ({ resource, variables }) =>
      run("create", () => {
        // The API boundary generates ids, as in the app's fake API.
        const record = { ...(variables as BaseRecord), id: uuid(9, ++created) };
        table(resource).push(record);
        return { data: structuredClone(record) as never };
      }),

    update: ({ resource, id, variables }) =>
      run("update", () => {
        const record = find(resource, id);
        if (!record) throw { message: `${resource}/${id} not found`, statusCode: 404 } satisfies HttpError;
        Object.assign(record, variables, { id: record.id });
        return { data: structuredClone(record) as never };
      }),

    deleteOne: ({ resource, id }) =>
      run("deleteOne", () => {
        const rows = table(resource);
        const index = rows.findIndex((record) => String(record.id) === String(id));
        const [removed] = index >= 0 ? rows.splice(index, 1) : [];
        return { data: (removed ?? {}) as never };
      }),
  };
}
