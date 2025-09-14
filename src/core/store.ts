// Based on: https://zustand.docs.pmnd.rs/guides/vanilla-store
// R3F events: https://r3f.docs.pmnd.rs/api/events

import { createStore } from "zustand";
import type {
  ControlsSchema,
  ParsedControl,
  ControlType,
  ControlConfig,
  ControlValue,
  FolderConfig,
} from "./types";
import { Color, Vector2, Vector3 } from "three";

interface XRControlsState {
  schemas: Map<string, ControlsSchema>;
  values: Map<string, any>;
  controls: Map<string, ParsedControl>;
  folders: Map<string, FolderConfig>;
  subscriptions: Map<string, Set<(value: any) => void>>;
}

interface XRControlsActions {
  registerSchema: (
    id: string,
    schema: ControlsSchema,
    options?: { order?: number },
  ) => void;
  unregisterSchema: (id: string) => void;
  getValue: (path: string) => any;
  setValue: (path: string, value: any) => void;
  subscribe: (path: string, callback: (value: any) => void) => () => void;
  getControl: (path: string) => ParsedControl | undefined;
  getAllControls: () => ParsedControl[];
  reset: () => void;
}

export type XRControlsStore = ReturnType<typeof createXRControlsStore>;

export function createXRControlsStore() {
  return createStore<XRControlsState & XRControlsActions>()((set, get) => ({
    schemas: new Map(),
    values: new Map(),
    controls: new Map(),
    folders: new Map(),
    subscriptions: new Map(),

    registerSchema: (id, schema, _options = {}) => {
      // const state = get()
      const parsedControls = parseSchema(id, schema);

      set((state) => {
        const newSchemas = new Map(state.schemas);
        const newControls = new Map(state.controls);
        const newValues = new Map(state.values);
        const newFolders = new Map(state.folders);

        newSchemas.set(id, schema);

        parsedControls.forEach((control) => {
          newControls.set(control.path.join("."), control);

          if (!newValues.has(control.path.join("."))) {
            newValues.set(control.path.join("."), control.value);
          }

          if (control.type === "folder") {
            newFolders.set(control.path.join("."), control.config as any);
          }
        });

        return {
          schemas: newSchemas,
          controls: newControls,
          values: newValues,
          folders: newFolders,
        };
      });
    },

    unregisterSchema: (id) => {
      set((state) => {
        const newSchemas = new Map(state.schemas);
        const newControls = new Map(state.controls);
        const newValues = new Map(state.values);
        const newFolders = new Map(state.folders);

        newSchemas.delete(id);

        // Remove controls and values for this schema
        Array.from(newControls.entries()).forEach(([path, control]) => {
          if (control.path[0] === id) {
            newControls.delete(path);
            newValues.delete(path);
            newFolders.delete(path);
          }
        });

        return {
          schemas: newSchemas,
          controls: newControls,
          values: newValues,
          folders: newFolders,
        };
      });
    },

    getValue: (path) => {
      return get().values.get(path);
    },

    setValue: (path, value) => {
      const control = get().controls.get(path);
      if (!control) return;

      set((state) => {
        const newValues = new Map(state.values);
        newValues.set(path, value);

        // Notify subscribers
        const subs = state.subscriptions.get(path);
        if (subs) {
          subs.forEach((callback) => callback(value));
        }

        // Call onChange if defined
        if (control.config.onChange) {
          control.config.onChange(value);
        }

        return { values: newValues };
      });
    },

    subscribe: (path, callback) => {
      set((state) => {
        const newSubs = new Map(state.subscriptions);
        const pathSubs = newSubs.get(path) || new Set();
        pathSubs.add(callback);
        newSubs.set(path, pathSubs);
        return { subscriptions: newSubs };
      });

      return () => {
        set((state) => {
          const newSubs = new Map(state.subscriptions);
          const pathSubs = newSubs.get(path);
          if (pathSubs) {
            pathSubs.delete(callback);
            if (pathSubs.size === 0) {
              newSubs.delete(path);
            }
          }
          return { subscriptions: newSubs };
        });
      };
    },

    getControl: (path) => {
      return get().controls.get(path);
    },

    getAllControls: () => {
      return Array.from(get().controls.values());
    },

    reset: () => {
      set({
        schemas: new Map(),
        values: new Map(),
        controls: new Map(),
        folders: new Map(),
        subscriptions: new Map(),
      });
    },
  }));
}

function parseSchema(
  id: string,
  schema: ControlsSchema,
  parentPath: string[] = [],
): ParsedControl[] {
  const controls: ParsedControl[] = [];

  Object.entries(schema).forEach(([key, value]) => {
    const path = parentPath.length === 0 ? [id, key] : [...parentPath, key];
    const control = parseControl(key, value, path);

    if (control) {
      controls.push(control);

      // Recursively parse folder contents
      if (
        control.type === "folder" &&
        typeof value === "object" &&
        "folder" in value
      ) {
        const folderControls = parseSchema(id, value.folder, path);
        controls.push(...folderControls);
      }
    }
  });

  return controls;
}

function parseControl(
  key: string,
  value: ControlValue,
  path: string[],
): ParsedControl | null {
  const id = path.join(".");
  let type: ControlType;
  let parsedValue: any;
  let config: ControlConfig = { value: undefined };

  // Handle folder
  if (typeof value === "object" && value !== null && "folder" in value) {
    type = "folder";
    config = value as any;
    parsedValue = null;
  }
  // Handle config object
  else if (typeof value === "object" && value !== null && "value" in value) {
    config = value as ControlConfig;
    parsedValue = config.value;
    type = detectType(parsedValue, config);
  }
  // Handle primitive
  else {
    parsedValue = value;
    type = detectType(value, {});
    config = { value: parsedValue };
  }

  return {
    id,
    key,
    type,
    value: parsedValue,
    config,
    path,
  };
}

function detectType(value: any, config: Partial<ControlConfig>): ControlType {
  // Check for explicit type via options
  if (config.options) {
    return "select";
  }

  // Check for button (function value)
  if (typeof value === "function") {
    return "button";
  }

  // Check for Three.js types
  if (value instanceof Color) {
    return "color";
  }
  if (value instanceof Vector2) {
    return "vector2";
  }
  if (value instanceof Vector3) {
    return "vector3";
  }

  // Check for color string
  if (
    typeof value === "string" &&
    value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  ) {
    return "color";
  }

  // Primitive types
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "string") {
    return "string";
  }

  return "custom";
}

// Global store singleton
let globalStore: XRControlsStore | null = null;

export function getGlobalStore(): XRControlsStore {
  if (!globalStore) {
    globalStore = createXRControlsStore();
  }
  return globalStore;
}
