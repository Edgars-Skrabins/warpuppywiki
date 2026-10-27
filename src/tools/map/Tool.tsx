import "leaflet/dist/leaflet.css";
import { useUrlState } from "@/core/state";
import { MapView } from "./components/MapView";
import { WorldTabs } from "./components/WorldTabs";
import { mapStateCodec, withBuildingKind, withLayer, withView, withWorld } from "./state";

export default function Tool() {
  const [state, setState] = useUrlState(mapStateCodec);
  return (
    <WorldTabs world={state.world} onWorldChange={(world) => setState((prev) => withWorld(prev, world))}>
      <MapView
        key={state.world}
        state={state}
        onViewChange={(center, zoom) => setState((prev) => withView(prev, center, zoom))}
        onGridChange={(grid) => setState((prev) => ({ ...prev, grid }))}
        onLayerChange={(id, on) => setState((prev) => withLayer(prev, id, on))}
        onBuildingKindChange={(kind, on) => setState((prev) => withBuildingKind(prev, kind, on))}
      />
    </WorldTabs>
  );
}
