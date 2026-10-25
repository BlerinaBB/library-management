// A minimal "other repository" that consumes the packed tarball through its public API only.
import {
  columns,
  DataTable,
  defineRelation,
  defineResource,
  fields,
  filters,
  fromDayjs,
  ResourceDrawer,
  ResourceForm,
  ResourcePage,
  toDayjs,
  useDrawerState,
  useResourceController,
} from "@library/resource-kit";
import type { DrawerState, FieldDef, FilterDef, ResourceConfig, ResourceColumn } from "@library/resource-kit";
import { Refine } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { App, ConfigProvider, Form } from "antd";
import type { Dayjs } from "dayjs";
import { createRoot } from "react-dom/client";

interface Team {
  id: string;
  name: string;
}
interface Player {
  id: string;
  name: string;
  salary: number;
  active: boolean;
  bornOn: string | null;
  teamId: string;
}
type PlayerForm = Omit<Player, "id" | "bornOn"> & { bornOn: Dayjs | null };

const playerTeam = defineRelation<Player, Team>({ resource: "teams", foreignKey: "teamId", valueField: "id", labelField: "name" });

const playerColumns: ResourceColumn<Player>[] = [
  columns.text("name"),
  columns.money("salary", { format: { currency: "EUR" } }),
  columns.boolean("active"),
  columns.date("bornOn"),
  columns.relation(playerTeam),
];
const playerFilters: FilterDef<Player>[] = [filters.text("name"), filters.boolean("active"), filters.relation(playerTeam)];
const playerFields: FieldDef<PlayerForm>[] = [
  fields.text("name", { rules: [{ required: true }] }),
  fields.money("salary", { currency: "EUR" }),
  fields.boolean("active"),
  fields.date("bornOn"),
  fields.relation("teamId", playerTeam),
];

const playerConfig: ResourceConfig<Player, PlayerForm, Omit<Player, "id">> = defineResource<Player, PlayerForm, Omit<Player, "id">>({
  name: "players",
  labels: { singular: "Player", plural: "Players" },
  table: { columns: playerColumns, filters: playerFilters },
  form: {
    fields: playerFields,
    toFormValues: (player) => ({ ...player, bornOn: toDayjs(player.bornOn) }),
    toVariables: (values) => ({ ...values, bornOn: fromDayjs(values.bornOn) }),
  },
});

// Lower-level pieces, without Refine.
function StandaloneEditor() {
  const drawer = useDrawerState();
  const [form] = Form.useForm<PlayerForm>();
  const state: DrawerState = drawer.state;
  return (
    <>
      <DataTable<Player> rowKey="id" columns={playerColumns} dataSource={[]} />
      <ResourceDrawer state={state} labels={playerConfig.labels} form={form} onClose={drawer.close} onSubmit={form.submit}>
        <ResourceForm<PlayerForm> form={form} fields={playerFields} />
      </ResourceDrawer>
    </>
  );
}

// The controller hook in a custom screen.
function PlayerCount() {
  const controller = useResourceController(playerConfig);
  return <span>{controller.records.length}</span>;
}

// Never executed by the check; only type-checked and bundled.
const dataProvider = {} as DataProvider;

createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <App>
      <Refine dataProvider={dataProvider} resources={[{ name: "players" }, { name: "teams" }]}>
        <ResourcePage config={playerConfig} />
        <PlayerCount />
        <StandaloneEditor />
      </Refine>
    </App>
  </ConfigProvider>,
);
