import { defineResource, fields, filters, fromDayjs, toDayjs } from "@library/resource-kit";
import { AutoComplete } from "antd";
import { columns } from "../formatting";
import type { Author, AuthorFormValues, AuthorVariables } from "./author.types";

const NATIONALITY_SUGGESTIONS = ["American", "British", "French", "German", "Irish", "Nigerian"].map((value) => ({ value }));

export const authorConfig = defineResource<Author, AuthorFormValues, AuthorVariables>({
  name: "authors",
  labels: { singular: "Author", plural: "Authors" },

  table: {
    pageSize: 10,
    initialSorters: [{ field: "name", order: "asc" }],
    columns: [
      columns.id("id", { width: 120, ellipsis: true }),
      columns.text("name", { sortable: true }),
      columns.text("nationality"),
      columns.date("birthDate", { title: "Born", sortable: true }),
      columns.longText("bio", { lines: 1, width: 320 }),
      columns.boolean("active", { format: { booleanLabels: { true: "Active", false: "Retired" } } }),
    ],
    filters: [
      filters.text("name", { placeholder: "Search by name" }),
      filters.text("nationality"),
      filters.boolean("active", { trueLabel: "Active", falseLabel: "Retired" }),
    ],
  },

  form: {
    fields: [
      fields.text("name", { rules: [{ required: true, whitespace: true, max: 120 }] }),
      fields.custom("nationality", {
        rules: [{ required: true }],
        render: ({ id, value, onChange }) => (
          <AutoComplete
            id={id}
            value={value}
            onChange={onChange}
            options={NATIONALITY_SUGGESTIONS}
            showSearch={{
              filterOption: (input, option) => option?.value.toLowerCase().includes(input.toLowerCase()) ?? false,
            }}
          />
        ),
      }),
      fields.date("birthDate", {
        label: "Birth date",
        props: { disabledDate: (date) => date.isAfter(new Date()) },
      }),
      fields.textarea("bio", { rules: [{ max: 2000 }] }),
      fields.boolean("active"),
    ],
    initialValues: { active: true, birthDate: null, bio: null },
    toFormValues: (author) => ({ ...author, birthDate: toDayjs(author.birthDate) }),
    toVariables: (values) => ({ ...values, bio: values.bio || null, birthDate: fromDayjs(values.birthDate) }),
  },
});
