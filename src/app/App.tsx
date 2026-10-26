import { RouterProvider } from "react-router";
import { DataProvider } from "@/core/data";
import { createAppRouter } from "./router";

const router = createAppRouter();

export function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  );
}
