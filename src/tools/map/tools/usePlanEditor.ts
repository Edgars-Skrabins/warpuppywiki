import { useEffect, useRef, useState } from "react";
import type { Vec2 } from "@/core/maps";
import { addMeasurePoint, addPin, addRingSet, PLAN_LIMITS, type Plan } from "../plan/plan";
import { parseCustomDistances, presetDistances, type CustomDistances, type RingPresetId } from "../plan/ringPresets";
import { isTypingTarget, MODE_HINTS, type MapMode } from "./useMapMode";

export interface PlanEditorOptions {
  plan: Plan;
  onPlanChange: (update: (plan: Plan) => Plan) => void;
  mode: MapMode;
  setMode: (mode: MapMode) => void;
}

export interface PlanEditor {
  hint: string | null;
  ringPreset: RingPresetId;
  setRingPreset: (preset: RingPresetId) => void;
  customText: string;
  setCustomText: (text: string) => void;
  custom: CustomDistances;
  editingPinId: number | null;
  setEditingPinId: (id: number | null) => void;
  onMapClick: (point: Vec2) => void;
  onMapDoubleClick: () => void;
}

const DEFAULT_CUSTOM = "250, 750";

function limitHint(mode: MapMode, plan: Plan): string | null {
  if (mode === "pin" && plan.pins.length >= PLAN_LIMITS.pins) {
    return `This map already has the maximum of ${PLAN_LIMITS.pins} pins.`;
  }
  if (mode === "rings" && plan.rings.length >= PLAN_LIMITS.ringSets) {
    return `This map already has the maximum of ${PLAN_LIMITS.ringSets} ring sets.`;
  }
  if (mode === "measure" && plan.measure.length >= PLAN_LIMITS.measurePoints) {
    return `A path can have up to ${PLAN_LIMITS.measurePoints} points.`;
  }
  return null;
}

export function usePlanEditor({ plan, onPlanChange, mode, setMode }: PlanEditorOptions): PlanEditor {
  const [finished, setFinished] = useState(false);
  const [ringPreset, setRingPreset] = useState<RingPresetId>("infantry");
  const [customText, setCustomText] = useState(DEFAULT_CUSTOM);
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const custom = parseCustomDistances(customText);
  const latest = useRef(plan);

  useEffect(() => {
    latest.current = plan;
  });

  useEffect(() => {
    if (mode !== "measure") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.key === "Enter") {
        setFinished(true);
      } else if (event.key === "Backspace" && latest.current.measure.length > 0) {
        event.preventDefault();
        onPlanChange((current) => ({ ...current, measure: current.measure.slice(0, -1) }));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mode, onPlanChange]);

  const onMapClick = (point: Vec2) => {
    if (mode === "measure") {
      const restart = finished || plan.measure.length === 0;
      setFinished(false);
      onPlanChange((current) => {
        const measure = addMeasurePoint(restart ? [] : current.measure, point);
        return measure === null ? current : { ...current, measure };
      });
    } else if (mode === "rings") {
      const distances = ringPreset === "custom" ? (custom.ok ? custom.distances : null) : presetDistances(ringPreset);
      if (distances !== null) {
        onPlanChange((current) => addRingSet(current, point, distances) ?? current);
      }
    } else if (mode === "pin") {
      const added = addPin(plan, point);
      if (added !== null) {
        onPlanChange(() => added.plan);
        setEditingPinId(added.pin.id);
        setMode("pan");
      }
    }
  };

  return {
    hint: limitHint(mode, plan) ?? MODE_HINTS[mode],
    ringPreset,
    setRingPreset,
    customText,
    setCustomText,
    custom,
    editingPinId,
    setEditingPinId,
    onMapClick,
    onMapDoubleClick: () => {
      if (mode === "measure") {
        setFinished(true);
      }
    },
  };
}
