// A third resource, as a consuming app would write it. This file is type-checked with the
// stories, so the documentation example cannot drift from the real API.
import { columns, defineRelation, defineResource, fields, filters, fromDayjs, ResourcePage, toDayjs } from "@library/resource-kit";
import type { Dayjs } from "dayjs";
import type { Book } from "../fixtures/library";

// 1. Domain model (API shape) and form shape.
export interface Member {
  id: string;
  fullName: string;
  email: string;
  joinedOn: string; // YYYY-MM-DD
  feePaid: number;
  active: boolean;
  favouriteBookId: string | null;
}
type MemberForm = Omit<Member, "id" | "joinedOn"> & { joinedOn: Dayjs | null };

// 2. Relation metadata, reused by column, filter and field.
const favouriteBook = defineRelation<Member, Book>({
  resource: "books",
  foreignKey: "favouriteBookId",
  valueField: "id",
  labelField: "title",
});

// 3. Resource configuration: the only resource-specific code.
export const memberConfig = defineResource<Member, MemberForm, Omit<Member, "id">>({
  name: "members",
  labels: { singular: "Member", plural: "Members" },
  relations: { favouriteBook },
  table: {
    columns: [
      columns.text("fullName", { title: "Name", sortable: true }),
      columns.text("email"),
      columns.date("joinedOn", { title: "Joined" }),
      columns.money("feePaid", { format: { currency: "EUR" } }),
      columns.boolean("active"),
      columns.relation(favouriteBook, { title: "Favourite book" }),
    ],
    filters: [filters.text("fullName", { label: "Name" }), filters.boolean("active"), filters.relation(favouriteBook)],
  },
  form: {
    fields: [
      fields.text("fullName", { label: "Name", rules: [{ required: true }] }),
      fields.text("email", { rules: [{ required: true, type: "email" }] }),
      fields.date("joinedOn", { label: "Joined", rules: [{ required: true }] }),
      fields.money("feePaid", { currency: "EUR" }),
      fields.boolean("active"),
      fields.relation("favouriteBookId", favouriteBook, { label: "Favourite book" }),
    ],
    initialValues: { active: true, feePaid: 0, joinedOn: null, favouriteBookId: null },
    toFormValues: (member) => ({ ...member, joinedOn: toDayjs(member.joinedOn) }),
    toVariables: (values) => ({ ...values, joinedOn: fromDayjs(values.joinedOn) ?? "" }),
  },
});

// 4. A thin page. Register `{ name: "members" }` with <Refine resources> and add a route.
export function MembersPage() {
  return <ResourcePage config={memberConfig} />;
}
