import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import dataProvider from "@refinedev/simple-rest";
import { App as AntdApp, ConfigProvider, Layout, Menu } from "antd";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { AuthorsPage } from "../resources/authors/AuthorsPage";
import { BookInventoryScreen } from "../resources/books/BookInventoryScreen";
import { BooksPage } from "../resources/books/BooksPage";

// The host app owns API configuration; the kit never sees this URL.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

function Shell() {
  const { pathname } = useLocation();
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[pathname]}
          items={[
            { key: "/authors", label: <Link to="/authors">Authors</Link> },
            { key: "/books", label: <Link to="/books">Books</Link> },
            { key: "/books/inventory", label: <Link to="/books/inventory">Inventory</Link> },
          ]}
        />
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AntdApp>
          <Refine
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerProvider}
            resources={[
              { name: "authors", list: "/authors" },
              { name: "books", list: "/books" },
            ]}
            options={{ disableTelemetry: true }}
          >
            <Routes>
              <Route element={<Shell />}>
                <Route index element={<Navigate to="/books" replace />} />
                <Route path="/authors" element={<AuthorsPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/books/inventory" element={<BookInventoryScreen />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
