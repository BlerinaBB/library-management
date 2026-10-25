import { ResourcePage } from "@library/resource-kit";
import { bookConfig } from "./book.config";

export function BooksPage() {
  return <ResourcePage config={bookConfig} controllerOptions={{ syncWithLocation: true }} />;
}
