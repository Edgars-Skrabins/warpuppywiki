import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Badge, formatCash, formatWeight, ItemIcon, Panel, StatRow } from "@/ui";
import { recoilLink, ttkLink } from "../logic/links";
import type { WeaponDetailModel } from "../logic/weaponDetail";
import { AmmoTable } from "./AmmoTable";
import { AttachmentList } from "./AttachmentList";
import { FalloffChart } from "./FalloffChart";
import { formatList, formatUnlock } from "./formatValue";
import { HitMultipliers } from "./HitMultipliers";
import { MagazineTable } from "./MagazineTable";
import { StatsGrid } from "./StatsGrid";
import styles from "./WeaponDetail.module.css";

export interface WeaponDetailProps {
  detail: WeaponDetailModel;
  backTo: string;
}

export function WeaponDetail({ detail, backTo }: WeaponDetailProps) {
  const { weapon } = detail;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: "start" });
  }, [weapon.id]);

  return (
    <article ref={ref} className={styles.detail} aria-label={weapon.name}>
      <Link to={backTo} className={styles.back}>
        ← All weapons
      </Link>
      <header className={styles.header}>
        <div className={styles.render}>
          <ItemIcon icon={weapon.item.icon} name={weapon.name} size={144} shape="wide" className={styles.renderIcon} />
        </div>
        <div className={styles.identity}>
          <p className={styles.eyebrow}>
            {formatList([weapon.archetype?.label ?? "Weapon", ...detail.calibers.map((caliber) => caliber.label)])}
          </p>
          <h2 className={styles.name}>{weapon.name}</h2>
          {detail.subtitle !== null && <p className={styles.subtitle}>{detail.subtitle}</p>}
          {detail.bullets.length > 0 && (
            <ul className={styles.bullets}>
              {detail.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          <div className={styles.badges}>
            {detail.price === null ? (
              <Badge>Not sold in shop</Badge>
            ) : (
              <Badge tone="tag">{formatCash(detail.price)}</Badge>
            )}
            {detail.unlock !== null && <Badge tone="info">Unlock: {formatUnlock(detail.unlock)}</Badge>}
          </div>
          <div className={styles.facts}>
            <StatRow label="Weight" value={formatWeight(detail.weight)} />
            <StatRow label="Inventory slots" value={formatList(detail.inventorySlots)} />
          </div>
          <nav aria-label="Open in other tools" className={styles.links}>
            <Link to={ttkLink(weapon.id)} className={styles.link}>
              Open in TTK Calculator
            </Link>
            <Link to={recoilLink(weapon.id)} className={styles.link}>
              Open in Recoil Viewer
            </Link>
          </nav>
        </div>
      </header>
      <Panel title="Stats">
        <StatsGrid stats={weapon.stats} />
      </Panel>
      <Panel title="Damage falloff">
        <FalloffChart name={weapon.name} stats={weapon.stats} />
      </Panel>
      <Panel title="Ammo" description="Shots to kill at 50 m, upper chest, 100 health, full-condition armor.">
        <AmmoTable rows={detail.ammo} />
      </Panel>
      <Panel title="Magazines">
        <MagazineTable rows={detail.magazines} />
      </Panel>
      <Panel title="Attachments">
        <AttachmentList slots={detail.attachmentSlots} builtIns={detail.builtIns} />
      </Panel>
      <Panel title="Hit-location multipliers" description={`Damage class ${detail.hitClass}`}>
        <div className={styles.hitTable}>
          <HitMultipliers rows={detail.hitMultipliers} />
        </div>
      </Panel>
    </article>
  );
}
