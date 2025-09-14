// Plugin API inspired by Leva: https://github.com/pmndrs/leva/tree/main/packages/plugin-spring

import type { ControlImpl, ControlType } from "./types";

const controlRegistry = new Map<string, ControlImpl>();

export function registerControl(type: string, impl: ControlImpl): void {
  controlRegistry.set(type, impl);
}

export function getControlImpl(type: ControlType): ControlImpl | undefined {
  return controlRegistry.get(type);
}

export function getAllControlImpls(): Map<string, ControlImpl> {
  return new Map(controlRegistry);
}
