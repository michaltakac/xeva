import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Types
export type ControlValue =
  | string
  | number
  | boolean
  | { x: number; y: number; z: number }
  | (() => void);

export interface ControlConfig {
  value?: ControlValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | number[];
  label?: string;
  onChange?: (value: ControlValue) => void;
}

export interface FolderConfig {
  [key: string]: ControlConfig | FolderConfig;
}

export interface ControlsSchema {
  [key: string]: ControlConfig | FolderConfig | ControlValue;
}

// Control data stored in the store
interface ControlData {
  key: string;
  path: string[];
  config: ControlConfig;
  value: ControlValue;
  type:
    | "number"
    | "boolean"
    | "string"
    | "select"
    | "color"
    | "vector3"
    | "button"
    | "folder";
}

// Store interface
interface XrevaStore {
  controls: Map<string, ControlData>;
  values: Record<string, ControlValue>;
  folders: Map<string, string[]>; // folder path -> child keys

  register: (path: string, config: ControlConfig | FolderConfig) => void;
  setValue: (path: string, value: ControlValue) => void;
  getValue: (path: string) => ControlValue | undefined;
  getValues: (prefix?: string) => Record<string, ControlValue>;
  getAllControls: () => ControlData[];
  getFolder: (path: string) => ControlData[];
  reset: () => void;
}

// Determine control type from config/value
function inferControlType(
  value: any,
  config: Partial<ControlConfig> = {},
): ControlData["type"] {
  // Button
  if (typeof value === "function") return "button";

  // Select
  if (config.options) return "select";

  // Color
  if (typeof value === "string" && value.startsWith("#")) return "color";

  // Vector3
  if (typeof value === "object" && value !== null && "x" in value)
    return "vector3";

  // Number
  if (typeof value === "number") return "number";

  // Boolean
  if (typeof value === "boolean") return "boolean";

  // String
  if (typeof value === "string") return "string";

  return "string";
}

// Parse schema into flat structure
function parseSchema(
  schema: ControlsSchema,
  parentPath: string[] = [],
): {
  controls: Map<string, ControlData>;
  values: Record<string, ControlValue>;
  folders: Map<string, string[]>;
} {
  const controls = new Map<string, ControlData>();
  const values: Record<string, ControlValue> = {};
  const folders = new Map<string, string[]>();

  Object.entries(schema).forEach(([key, item]) => {
    const path = [...parentPath, key];
    const pathStr = path.join(".");

    // Check if it's a folder (nested object without value property)
    const isFolder =
      typeof item === "object" &&
      item !== null &&
      !("value" in item) &&
      typeof item !== "function" &&
      !item.hasOwnProperty("x"); // not a vector3

    if (isFolder) {
      // It's a folder
      controls.set(pathStr, {
        key,
        path,
        config: {},
        value: "",
        type: "folder",
      });

      // Parse folder contents
      const folderResult = parseSchema(item as ControlsSchema, path);
      folderResult.controls.forEach((control, key) =>
        controls.set(key, control),
      );
      Object.assign(values, folderResult.values);
      folderResult.folders.forEach((children, key) =>
        folders.set(key, children),
      );

      // Track folder children
      const childKeys = Object.keys(item as ControlsSchema).map((childKey) =>
        [...path, childKey].join("."),
      );
      folders.set(pathStr, childKeys);
    } else {
      // It's a control
      let config: ControlConfig;
      let value: ControlValue;

      if (typeof item === "object" && item !== null && "value" in item) {
        // Config object
        config = item as ControlConfig;
        value = config.value!;
      } else {
        // Direct value
        config = { value: item as ControlValue };
        value = item as ControlValue;
      }

      const type = inferControlType(value, config);

      controls.set(pathStr, {
        key,
        path,
        config,
        value,
        type,
      });

      if (type !== "button") {
        values[pathStr] = value;
      }
    }
  });

  return { controls, values, folders };
}

// Global store
export const useXrevaStore = create<XrevaStore>()(
  subscribeWithSelector((set, get) => ({
    controls: new Map(),
    values: {},
    folders: new Map(),

    register: () => {
      // Implementation handled by parseSchema in useControls hook
    },

    setValue: (path, value) => {
      set((state) => {
        const control = state.controls.get(path);
        if (!control) return state;

        // Update control data
        const newControls = new Map(state.controls);
        newControls.set(path, { ...control, value });

        // Call onChange if provided
        if (control.config.onChange) {
          control.config.onChange(value);
        }

        // Don't store button values
        if (control.type === "button") {
          return { controls: newControls };
        }

        return {
          controls: newControls,
          values: {
            ...state.values,
            [path]: value,
          },
        };
      });
    },

    getValue: (path) => {
      return get().values[path];
    },

    getValues: (prefix) => {
      const allValues = get().values;
      if (!prefix) return allValues;

      const filtered: Record<string, ControlValue> = {};
      Object.keys(allValues).forEach((key) => {
        if (key.startsWith(prefix)) {
          const shortKey = key.slice(prefix.length + 1); // +1 for the dot
          filtered[shortKey] = allValues[key];
        }
      });
      return filtered;
    },

    getAllControls: () => {
      return Array.from(get().controls.values());
    },

    getFolder: (path) => {
      const children = get().folders.get(path) || [];
      return children
        .map((childPath) => get().controls.get(childPath)!)
        .filter(Boolean);
    },

    reset: () => {
      set({ controls: new Map(), values: {}, folders: new Map() });
    },
  })),
);

// Main hook - Leva-like API
export function useControls(
  nameOrSchema: string | ControlsSchema,
  schema?: ControlsSchema,
) {
  const name = typeof nameOrSchema === "string" ? nameOrSchema : "controls";
  const actualSchema =
    typeof nameOrSchema === "string" ? schema! : nameOrSchema;

  const store = useXrevaStore();
  const initialized = useRef(false);

  // Initialize controls on first render
  useEffect(() => {
    if (!initialized.current) {
      const parsed = parseSchema(actualSchema, [name]);

      useXrevaStore.setState((state) => ({
        controls: new Map([...state.controls, ...parsed.controls]),
        values: { ...state.values, ...parsed.values },
        folders: new Map([...state.folders, ...parsed.folders]),
      }));

      initialized.current = true;
    }

    return () => {
      // Cleanup on unmount
      if (initialized.current) {
        const prefix = name + ".";
        useXrevaStore.setState((state) => {
          const newControls = new Map(state.controls);
          const newValues = { ...state.values };
          const newFolders = new Map(state.folders);

          // Remove all controls with this prefix
          Array.from(newControls.keys()).forEach((key) => {
            if (key.startsWith(prefix) || key === name) {
              newControls.delete(key);
              delete newValues[key];
              newFolders.delete(key);
            }
          });

          return {
            controls: newControls,
            values: newValues,
            folders: newFolders,
          };
        });
        initialized.current = false;
      }
    };
  }, []);

  // Subscribe to value changes
  const values = useXrevaStore((state) => state.getValues(name));

  // Create setters
  const setters = useMemo(() => {
    const s: Record<string, (value: any) => void> = {};
    Object.keys(values).forEach((key) => {
      s[key] = (value: any) => store.setValue(`${name}.${key}`, value);
    });
    return s;
  }, [name, values]);

  // Return values with setters
  return useMemo(() => {
    const result: Record<string, any> = {};
    Object.keys(values).forEach((key) => {
      result[key] = values[key];
      // Add setter as a property (for compatibility)
      if (setters[key]) {
        Object.defineProperty(
          result,
          `set${key.charAt(0).toUpperCase()}${key.slice(1)}`,
          {
            value: setters[key],
            enumerable: false,
          },
        );
      }
    });
    return result;
  }, [values, setters]);
}
