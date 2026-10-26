import { Outlet, ScrollRestoration } from "react-router";
import { DataMissingError, useBuilds } from "@/core/data";
import type { ToolDefinition } from "@/core/tool";
import { DataStateView } from "@/ui";
import { Footer } from "./Footer";
import { Header } from "./Header";
import styles from "./AppLayout.module.css";

export function AppLayout({ tools }: { tools: readonly ToolDefinition[] }) {
  const builds = useBuilds();
  const isDataMissing = builds.status === "error" && builds.error instanceof DataMissingError;
  return (
    <div className={styles.shell}>
      <Header tools={tools} />
      <main className={styles.main}>
        {isDataMissing ? <DataStateView state={builds}>{() => null}</DataStateView> : <Outlet />}
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
