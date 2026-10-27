import "leaflet/dist/leaflet.css";
import { useCallback } from "react";
import { MapView } from "./components/MapView";
import { WorldTabs } from "./components/WorldTabs";
import type { Los } from "./los/losState";
import type { Plan } from "./plan/plan";
import { withBuildingKind, withLayer, withPlan, withView, withWorld } from "./state";
import { useMapState } from "./useMapState";

export default function Tool() {
  const [state, setState, { shareUrl }] = useMapState();
  const onPlanChange = useCallback(
    (update: (plan: Plan) => Plan) => setState((prev) => withPlan(prev, prev.world, update)),
    [setState],
  );
  const onLosChange = useCallback(
    (update: (los: Los) => Los) => setState((prev) => ({ ...prev, los: update(prev.los) })),
    [setState],
  );
  return (
    <WorldTabs world={state.world} onWorldChange={(world) => setState((prev) => withWorld(prev, world))}>
      <MapView
        key={state.world}
        state={state}
        onViewChange={(center, zoom) => setState((prev) => withView(prev, center, zoom))}
        onGridChange={(grid) => setState((prev) => ({ ...prev, grid }))}
        onLayerChange={(id, on) => setState((prev) => withLayer(prev, id, on))}
        onBuildingKindChange={(kind, on) => setState((prev) => withBuildingKind(prev, kind, on))}
        onPlanChange={onPlanChange}
        onLosChange={onLosChange}
        shareUrl={shareUrl}
      />
    </WorldTabs>
  );
}
