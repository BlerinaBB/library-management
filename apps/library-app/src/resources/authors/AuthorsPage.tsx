import { ResourcePage } from "@library/resource-kit";
import { authorConfig } from "./author.config";

export function AuthorsPage() {
  return <ResourcePage config={authorConfig} controllerOptions={{ syncWithLocation: true }} />;
}
