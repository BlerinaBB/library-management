import { Spin, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { humanize } from "../config/defineResource";
import {
  DEFAULT_EMPTY_TEXT,
  formatDate,
  formatMoney,
  formatNumber,
  isMissing,
  mergeFormat,
} from "../config/formatting";
import { PENDING_LOOKUP, getRelationLabel } from "../config/relations";
import type { ColumnOptions, RelationColumn, RowAction, TableColumn } from "../types/column";
import type { FormatOptions } from "../types/format";
import type { BooleanKey, DateKey, DateInput, EnumKey, IdKey, NumberKey, RecordId, StringKey } from "../types/keys";
import type { EnumOption } from "../types/options";
import type { AnyRelation } from "../types/relation";
import { RowActions } from "./RowActions";

export interface LongTextColumnOptions<T> extends ColumnOptions<T> {
  /** Visible lines before truncation. Defaults to 2. */
  lines?: number;
}

export interface EnumColumnOptions<T, V extends string | number> extends ColumnOptions<T> {
  options: ReadonlyArray<EnumOption<V>>;
}

export interface RelationColumnOptions<T, R = any> extends ColumnOptions<T> {
  /** Renders a resolved related record. Defaults to the relation label. */
  renderRelated?: (related: R, record: T) => ReactNode;
  /** Renders a foreign key whose related record was not found. */
  renderMissing?: (id: RecordId, record: T) => ReactNode;
}

export interface ActionsColumnOptions<T> extends Partial<TableColumn<T>> {
  actions: (record: T) => ReadonlyArray<RowAction<T>>;
}

/** Pure factories returning Ant Design column definitions. Bind formatting defaults with `createColumnFactories`. */
export interface ColumnFactories {
  id<T>(key: IdKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  text<T>(key: StringKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  longText<T>(key: StringKey<T>, options?: LongTextColumnOptions<T>): TableColumn<T>;
  date<T>(key: DateKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  boolean<T>(key: BooleanKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  number<T>(key: NumberKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  money<T>(key: NumberKey<T>, options?: ColumnOptions<T>): TableColumn<T>;
  enum<T, K extends EnumKey<T>>(
    key: K,
    options: EnumColumnOptions<T, Extract<NonNullable<T[K]>, string | number>>,
  ): TableColumn<T>;
  /** Renders a foreign key using related records resolved for the current page. Never fetches. */
  relation<T, R = any>(relation: AnyRelation<T>, options?: RelationColumnOptions<T, R>): RelationColumn<T>;
  actions<T>(options: ActionsColumnOptions<T>): TableColumn<T>;
}

/** Shared column shape. `render` receives the field value typed by the calling factory. */
function base<T, V>(
  key: string,
  options: ColumnOptions<T> | undefined,
  defaults: Partial<TableColumn<T>>,
  render: (value: V, record: T) => ReactNode,
): TableColumn<T> {
  const { sortable, format: _format, ...overrides } = options ?? {};
  return {
    key,
    dataIndex: key,
    title: humanize(key),
    ...(sortable ? { sorter: true } : {}),
    ...defaults,
    render: (value: V, record: T) => render(value, record),
    ...overrides,
  };
}

export function createColumnFactories(defaults: FormatOptions = {}): ColumnFactories {
  const emptyOf = (format: FormatOptions): ReactNode => format.emptyText ?? DEFAULT_EMPTY_TEXT;
  const orEmpty = (text: ReactNode | undefined, format: FormatOptions): ReactNode => (text === undefined ? emptyOf(format) : text);

  return {
    id(key, options) {
      const format = mergeFormat(defaults, options?.format);
      return base(key, options, { title: "ID", width: 90 }, (value: RecordId | null | undefined) =>
        isMissing(value) ? emptyOf(format) : String(value),
      );
    },

    text(key, options) {
      const format = mergeFormat(defaults, options?.format);
      return base(key, options, { ellipsis: true }, (value: string | null | undefined) =>
        isMissing(value) ? emptyOf(format) : value,
      );
    },

    longText(key, options) {
      const format = mergeFormat(defaults, options?.format);
      const { lines = 2, ...rest } = options ?? {};
      return base(key, rest, {}, (value: string | null | undefined) =>
        isMissing(value) ? (
          emptyOf(format)
        ) : (
          <Typography.Paragraph ellipsis={{ rows: lines, tooltip: value }} style={{ marginBottom: 0 }}>
            {value}
          </Typography.Paragraph>
        ),
      );
    },

    date(key, options) {
      const format = mergeFormat(defaults, options?.format);
      return base(key, options, {}, (value: DateInput | null | undefined) => orEmpty(formatDate(value, format), format));
    },

    boolean(key, options) {
      const format = mergeFormat(defaults, options?.format);
      const labels = format.booleanLabels ?? { true: "Yes", false: "No" };
      return base(key, options, { align: "center" }, (value: boolean | null | undefined) =>
        isMissing(value) ? emptyOf(format) : <Tag color={value ? "green" : "default"}>{value ? labels.true : labels.false}</Tag>,
      );
    },

    number(key, options) {
      const format = mergeFormat(defaults, options?.format);
      return base(key, options, { align: "right" }, (value: number | null | undefined) =>
        orEmpty(formatNumber(value, format), format),
      );
    },

    money(key, options) {
      const format = mergeFormat(defaults, options?.format);
      return base(key, options, { align: "right" }, (value: number | null | undefined) =>
        orEmpty(formatMoney(value, format), format),
      );
    },

    enum(key, options) {
      const format = mergeFormat(defaults, options.format);
      const { options: enumOptions, ...rest } = options;
      const byValue = new Map(enumOptions.map((option) => [option.value, option] as const));
      return base(key, rest, {}, (value: string | number | null | undefined) => {
        if (isMissing(value)) return emptyOf(format);
        const option = byValue.get(value as never);
        if (!option) return String(value);
        return option.color ? <Tag color={option.color}>{option.label}</Tag> : option.label;
      });
    },

    relation(relation, options) {
      const format = mergeFormat(defaults, options?.format);
      const { renderRelated, renderMissing, ...rest } = options ?? {};
      return {
        relation,
        bind: (lookup) =>
          base(relation.foreignKey, rest, {}, (value: RecordId | null | undefined, record) => {
            if (isMissing(value)) return emptyOf(format);
            // Not requested (no relation data supplied): fall back to the raw key.
            if (!lookup) return String(value);
            if (lookup === PENDING_LOOKUP) return <Spin size="small" />;
            const related = lookup.get(String(value));
            if (related === undefined) {
              return renderMissing ? (
                renderMissing(value, record)
              ) : (
                <Typography.Text type="secondary">#{String(value)}</Typography.Text>
              );
            }
            return renderRelated ? renderRelated(related, record) : getRelationLabel(relation, related);
          }),
      };
    },

    actions({ actions, ...overrides }) {
      return {
        key: "__actions",
        title: "Actions",
        fixed: "right",
        width: 140,
        render: (_: unknown, record) => <RowActions record={record} actions={actions(record)} />,
        ...overrides,
      };
    },
  };
}

/** Column factories using the runtime locale and no currency. */
export const columns: ColumnFactories = createColumnFactories();
