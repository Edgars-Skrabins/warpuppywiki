import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import { useAssetsManifest, useWorldData, type MapFile } from "@/core/data";
import { useHeightmap, type Vec2 } from "@/core/maps";
import { DataStateView, ErrorState, LoadingState } from "@/ui";
import { BuildingsLayer } from "../layers/BuildingsLayer";
import { GridLayer } from "../layers/GridLayer";
import { LAYERS, type LayerId } from "../layers/layerDefinitions";
import { ObjectivesLayer } from "../layers/ObjectivesLayer";
import { ObjectsLayer } from "../layers/ObjectsLayer";
import { TileLayer } from "../layers/TileLayer";
import { useLayerData } from "../layers/useLayerData";
import { mapCrs, MAX_ZOOM, PAN_MARGIN, worldBounds } from "../leaflet/crs";
import { latLngToWorld, worldToLatLng } from "../leaflet/projection";
import type { BuildingKind } from "../logic/buildingStyle";
import { mapProblem, syncedNativeZoom } from "../logic/mapMeta";
import type { MapState } from "../state";
import { LayersPanel } from "./LayersPanel";
import { MapControls } from "./MapControls";
import { MissingImagery } from "./MissingImagery";
import { Readout } from "./Readout";
import styles from "./MapView.module.css";

export interface MapViewProps {
  state: MapState;
  onViewChange: (center: Vec2, zoom: number) => void;
  onGridChange: (grid: boolean) => void;
  onLayerChange: (id: LayerId, on: boolean) => void;
  onBuildingKindChange: (kind: BuildingKind, on: boolean) => void;
}

const OBJECT_LAYERS = LAYERS.filter((definition) => definition.objectKinds.length > 0);

interface ViewSyncProps {
  map: MapFile;
  center: Vec2 | null;
  zoom: number | null;
  onReady: () => void;
  onZoom: (zoom: number) => void;
  onViewChange: (center: Vec2, zoom: number) => void;
}

function ViewSync({ map, center, zoom, onReady, onZoom, onViewChange }: ViewSyncProps) {
  const leafletMap = useMap();
  const [initial] = useState({ center, zoom });
  const callbacks = useRef({ onReady, onZoom, onViewChange });

  useEffect(() => {
    callbacks.current = { onReady, onZoom, onViewChange };
  });

  useEffect(() => {
    const container = leafletMap.getContainer();
    let started = false;
    const handleMoveEnd = () => {
      const current = leafletMap.getZoom();
      callbacks.current.onZoom(current);
      callbacks.current.onViewChange(latLngToWorld(map, leafletMap.getCenter(), leafletMap), current);
    };
    const start = () => {
      started = true;
      leafletMap.setMaxBounds(worldBounds(map, leafletMap, PAN_MARGIN));
      if (initial.center !== null && initial.zoom !== null) {
        leafletMap.setView(worldToLatLng(map, initial.center[0], initial.center[1], leafletMap), initial.zoom);
      } else {
        leafletMap.fitBounds(worldBounds(map, leafletMap));
      }
      callbacks.current.onZoom(leafletMap.getZoom());
      callbacks.current.onReady();
      leafletMap.on("moveend", handleMoveEnd);
    };
    if (typeof ResizeObserver === "undefined") {
      start();
      return () => {
        leafletMap.off("moveend", handleMoveEnd);
      };
    }
    const observer = new ResizeObserver(() => {
      leafletMap.invalidateSize();
      if (!started && container.clientWidth > 0 && container.clientHeight > 0) {
        start();
      }
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      leafletMap.off("moveend", handleMoveEnd);
    };
  }, [leafletMap, map, initial]);

  return null;
}

function PointerFocus() {
  const leafletMap = useMap();
  useEffect(() => {
    const container = leafletMap.getContainer();
    const markPointer = () => {
      container.dataset.pointer = "";
    };
    const clearPointer = () => {
      delete container.dataset.pointer;
    };
    container.addEventListener("pointerdown", markPointer);
    document.addEventListener("keydown", clearPointer);
    return () => {
      container.removeEventListener("pointerdown", markPointer);
      document.removeEventListener("keydown", clearPointer);
    };
  }, [leafletMap]);
  return null;
}

function CursorTracker({ map, onCursor }: { map: MapFile; onCursor: (cursor: Vec2 | null) => void }) {
  const leafletMap = useMapEvents({
    mousemove: (event) => onCursor(latLngToWorld(map, event.latlng, leafletMap)),
    mouseout: () => onCursor(null),
  });
  return null;
}

interface LoadedMapProps extends MapViewProps {
  map: MapFile;
  maxNativeZoom: number | null;
}

function LoadedMap({
  map,
  maxNativeZoom,
  state,
  onViewChange,
  onGridChange,
  onLayerChange,
  onBuildingKindChange,
}: LoadedMapProps) {
  const heightmap = useHeightmap(state.world);
  const layerData = useLayerData(state.world);
  const { layers } = state;
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [cursor, setCursor] = useState<Vec2 | null>(null);

  return (
    <div className={styles.view}>
      <div className={styles.frame}>
        <MapContainer
          ref={setLeafletMap}
          className={styles.map}
          crs={mapCrs}
          minZoom={map.tiles.minZoom}
          maxZoom={MAX_ZOOM}
          maxBoundsViscosity={1}
          zoomSnap={0.25}
          zoomControl={false}
          attributionControl={false}
        >
          <ViewSync
            map={map}
            center={state.center}
            zoom={state.zoom}
            onReady={() => setReady(true)}
            onZoom={setZoom}
            onViewChange={onViewChange}
          />
          <PointerFocus />
          {ready && (
            <>
              {maxNativeZoom !== null && <TileLayer map={map} world={state.world} maxNativeZoom={maxNativeZoom} />}
              {state.grid && <GridLayer map={map} />}
              {layers.buildings && (
                <BuildingsLayer map={map} buildings={layerData.buildings} kinds={state.buildingKinds} />
              )}
              {layers.objectives && layerData.standard !== null && (
                <ObjectivesLayer map={map} config={layerData.standard} variant="standard" title="Control zone" />
              )}
              {layers.objectives && layers.sniperShowdown && layerData.sniperShowdown !== null && (
                <ObjectivesLayer
                  map={map}
                  config={layerData.sniperShowdown}
                  variant="sniperShowdown"
                  title="Sniper Showdown zone"
                />
              )}
              {OBJECT_LAYERS.map(
                (definition) =>
                  layers[definition.id] && (
                    <ObjectsLayer key={definition.id} map={map} objects={layerData.objects[definition.id] ?? []} />
                  ),
              )}
              <CursorTracker map={map} onCursor={setCursor} />
            </>
          )}
        </MapContainer>
        {leafletMap && (
          <MapControls map={map} leafletMap={leafletMap} zoom={zoom} grid={state.grid} onGridChange={onGridChange}>
            <LayersPanel
              data={layerData}
              layers={layers}
              buildingKinds={state.buildingKinds}
              zoom={zoom}
              onLayerChange={onLayerChange}
              onBuildingKindChange={onBuildingKindChange}
            />
          </MapControls>
        )}
        {maxNativeZoom === null && <MissingImagery />}
      </div>
      <Readout map={map} cursor={cursor} heightmap={heightmap} zoom={zoom} />
    </div>
  );
}

export function MapView(props: MapViewProps) {
  const map = useWorldData(props.state.world, "map");
  const manifest = useAssetsManifest();
  const loading = <LoadingState variant="block" height="70vh" label="Loading map…" />;

  if (manifest.status === "loading") {
    return loading;
  }
  return (
    <DataStateView state={map} loading={loading}>
      {(data) => {
        const problem = mapProblem(data);
        if (problem !== null) {
          return <ErrorState title="This map can't be shown" text={problem} />;
        }
        const synced = manifest.status === "success" ? manifest.data?.worlds[props.state.world]?.maxZoom : null;
        return <LoadedMap {...props} map={data} maxNativeZoom={syncedNativeZoom(data, synced)} />;
      }}
    </DataStateView>
  );
}
