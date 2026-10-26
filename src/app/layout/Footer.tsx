import { useLatestBuild } from "@/core/data";
import styles from "./Footer.module.css";

const DATA_PROJECT_URL = "https://github.com/warpuppies/wardogs-data";

export function Footer() {
  const build = useLatestBuild();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.disclaimer}>
          Unofficial fan project. Not affiliated with Bulkhead or Team17. Wardogs names, numbers and imagery belong to
          their owners. Data:{" "}
          <a href={DATA_PROJECT_URL} target="_blank" rel="noreferrer" className={styles.link}>
            warpuppies/wardogs-data
          </a>
          .
        </p>
        {build.status === "success" && <p className={styles.build}>Game build {build.data}</p>}
      </div>
    </footer>
  );
}
