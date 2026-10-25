import { ResourcePage } from "@library/resource-kit";
import { bookConfig } from "./book.config";

export function BooksPage() {
  return (
    <ResourcePage
      config={bookConfig}
      controllerOptions={{ syncWithLocation: true }}
      // Business rule owned by the app: books that are in stock cannot be deleted.
      rowActions={(book, defaults) =>
        defaults.map((action) => (action.key === "delete" ? { ...action, disabled: book.inStock } : action))
      }
    />
  );
}
