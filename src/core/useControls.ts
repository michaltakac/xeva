import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from 'zustand/react/shallow';
import { getGlobalStore } from "./store";

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
  /**
   * Whether the control should update reactively as the user interacts.
   * Matches Leva's transient flag for parity.
   */
  transient?: boolean;
}

export interface FolderConfig {
  folder: ControlsSchema;
  collapsed?: boolean;
  order?: number;
  label?: string;
}

export interface ControlsSchema {
  [key: string]: ControlConfig | FolderConfig | ControlValue;
}

// Control data stored in the store
interface ControlData {
  key: string;
  path: string[];
  config: ControlConfig | Record<string, unknown>;
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

interface FolderState {
  children: string[];
  config?: Record<string, unknown>;
}

// Store interface
interface XrevaStore {
  controls: Map<string, ControlData>;
  values: Record<string, ControlValue>;
  folders: Map<string, FolderState>;
  controlsArray: ControlData[];

  register: (path: string, config: ControlConfig | FolderConfig) => void;
  setValue: (path: string, value: ControlValue) => void;
  getValue: (path: string) => ControlValue | undefined;
  getValues: (prefix?: string) => Record<string, ControlValue>;
  getAllControls: () => ControlData[];
  getFolder: (path: string) => ControlData[];
  reset: () => void;
}

const ID_PREFIX = "xreva";

function createId() {
  return `${ID_PREFIX}-${Math.random().toString(36).slice(2, 10)}`;
}

function isVector3Like(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in (value as any) &&
    "y" in (value as any) &&
    "z" in (value as any)
  );
}

function serializeSchema(schema: ControlsSchema): string {
  const seen = new WeakSet();
  return JSON.stringify(schema, (_key, value) => {
    if (typeof value === "function") {
      return "__fn__";
    }
    if (typeof value === "object" && value !== null) {
      if (seen.has(value as object)) {
        return "__ref__";
      }
      seen.add(value as object);
    }
    return value;
  });
}

function setNestedValue(
  target: Record<string, any>,
  path: string[],
  value: unknown,
): void {
  let cursor = target;
  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];
    if (cursor[part] === undefined) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[path[path.length - 1]] = value;
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  if (isVector3Like(value))
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
  folders: Map<string, FolderState>;
} {
  const controls = new Map<string, ControlData>();
  const values: Record<string, ControlValue> = {};
  const folders = new Map<string, FolderState>();

  Object.entries(schema).forEach(([key, item]) => {
    const path = [...parentPath, key];
    const pathStr = path.join(".");

    // Check if it's a folder (nested object without value property)
    const isFolder =
      typeof item === "object" &&
      item !== null &&
      !("value" in (item as Record<string, unknown>)) &&
      typeof item !== "function" &&
      !isVector3Like(item);

    if (isFolder) {
      const rawFolder = item as Record<string, any>;
      const folderSchema = (rawFolder.folder as ControlsSchema) ?? (item as ControlsSchema);
      const folderConfig = rawFolder.folder ? { ...rawFolder, folder: undefined } : {};

      controls.set(pathStr, {
        key,
        path,
        config: folderConfig,
        value: "",
        type: "folder",
      });

      const folderResult = parseSchema(folderSchema, path);
      folderResult.controls.forEach((control, key) =>
        controls.set(key, control),
      );
      Object.assign(values, folderResult.values);
      folderResult.folders.forEach((children, key) =>
        folders.set(key, children),
      );

      // Track folder children
      const childKeys = Object.keys(folderSchema).map((childKey) =>
        [...path, childKey].join("."),
      );
      folders.set(pathStr, {
        children: childKeys,
        config: folderConfig,
      });
    } else {
      const { config, value } = normalizeControlConfig(item as any, key);
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

function normalizeControlConfig(
  item: ControlValue | ControlConfig,
  key: string,
): { config: ControlConfig; value: ControlValue } {
  if (typeof item === "object" && item !== null && "value" in item) {
    const cfg = item as ControlConfig;
    const value =
      cfg.value !== undefined
        ? cfg.value
        : resolveDefaultValue(cfg, key);
    return {
      config: { ...cfg, value },
      value,
    };
  }

  return {
    config: { value: item as ControlValue },
    value: item as ControlValue,
  };
}

function resolveDefaultValue(config: ControlConfig, key: string): ControlValue {
  if (config.options) {
    const options = Array.isArray(config.options)
      ? config.options
      : Object.values(config.options);
    if (options.length > 0) {
      return options[0] as ControlValue;
    }
  }

  if (config.min !== undefined) {
    return config.min;
  }

  console.warn(
    `[xreva] Control "${key}" is missing an initial value; defaulting to empty string.`,
  );
  return "";
}

// Global Zustand store with performance optimizations
export const useXrevaStore = create<XrevaStore>()(
  subscribeWithSelector((set, get) => ({
    controls: new Map(),
    values: {},
    folders: new Map(),
    controlsArray: [],

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
        const newControlsArray = Array.from(newControls.values());

        // Don't store button values
        if (control.type === "button") {
          // For buttons, just trigger onChange
          if (control.config.onChange) {
            control.config.onChange(value);
          }
          return { 
            controls: newControls,
            controlsArray: newControlsArray
          };
        }

        // Trigger onChange callback
        if (control.config.onChange) {
          control.config.onChange(value);
        }

        return {
          controls: newControls,
          controlsArray: newControlsArray,
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
      const values = get().values;
      if (!prefix) return values;

      const result: Record<string, ControlValue> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (key === prefix) return;
        if (key.startsWith(`${prefix}.`)) {
          const shortKey = key.slice(prefix.length + 1);
          result[shortKey] = value;
        }
      });
      return result;
    },

    getAllControls: () => {
      return get().controlsArray;
    },

    getFolder: (path) => {
      const folder = get().folders.get(path);
      if (!folder) return [];
      return folder.children
        .map((childPath) => get().controls.get(childPath)!)
        .filter(Boolean);
    },

    reset: () => {
      set({ 
        controls: new Map(), 
        values: {}, 
        folders: new Map(), 
        controlsArray: [] 
      });
    },
  })),
);

// Expose store globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useXrevaStore = useXrevaStore;
}

// Main hook - Leva-like API
export function useControls(
  nameOrSchema: string | ControlsSchema,
  schema?: ControlsSchema,
) {
  const generatedNameRef = useRef<string | undefined>(undefined);
  if (!generatedNameRef.current && typeof nameOrSchema !== "string") {
    generatedNameRef.current = createId();
  }

  const name =
    typeof nameOrSchema === "string"
      ? nameOrSchema
      : generatedNameRef.current ?? createId();
  const actualSchema =
    typeof nameOrSchema === "string" ? schema! : nameOrSchema;

  const store = useXrevaStore();
  const initialized = useRef(false);
  const schemaSignatureRef = useRef<string | null>(null);

  const schemaSignature = useMemo(
    () => serializeSchema(actualSchema),
    [actualSchema],
  );

  const parsedSchema = useMemo(
    () => parseSchema(actualSchema, [name]),
    [schemaSignature, name],
  );

  // Initialize controls on first render or when schema changes
  useEffect(() => {
    const hasChanged = schemaSignatureRef.current !== schemaSignature;

    if (!initialized.current || hasChanged) {
      useXrevaStore.setState((state) => {
        const newControls = new Map(state.controls);
        const newValues = { ...state.values };
        const newFolders = new Map(state.folders);

        // Clear old controls
        const prefix = `${name}.`;
        Array.from(newControls.keys()).forEach((key) => {
          if (key === name || key.startsWith(prefix)) {
            newControls.delete(key);
            delete newValues[key];
            newFolders.delete(key);
          }
        });

        // Add new controls
        parsedSchema.controls.forEach((control, controlPath) => {
          newControls.set(controlPath, control);
        });
        
        Object.entries(parsedSchema.values).forEach(([path, value]) => {
          newValues[path] = value;
        });
        
        parsedSchema.folders.forEach((folder, folderPath) => {
          newFolders.set(folderPath, folder);
        });

        return {
          controls: newControls,
          controlsArray: Array.from(newControls.values()),
          values: newValues,
          folders: newFolders,
        };
      });

      schemaSignatureRef.current = schemaSignature;
      initialized.current = true;
    }

    return () => {
      // Cleanup on unmount
      if (initialized.current) {
        const prefix = `${name}.`;
        useXrevaStore.setState((state) => {
          const newControls = new Map(state.controls);
          const newValues = { ...state.values };
          const newFolders = new Map(state.folders);

          Array.from(newControls.keys()).forEach((key) => {
            if (key === name || key.startsWith(prefix)) {
              newControls.delete(key);
              delete newValues[key];
              newFolders.delete(key);
            }
          });

          return {
            controls: newControls,
            controlsArray: Array.from(newControls.values()),
            values: newValues,
            folders: newFolders,
          };
        });
        initialized.current = false;
        schemaSignatureRef.current = null;
      }
    };
  }, [schemaSignature, name]);

  // Get values and setters with performance optimization
  const prefix = `${name}.`;
  
  // Use selectors to only subscribe to relevant values
  const values = useXrevaStore(
    useShallow((state) => {
      const result: Record<string, ControlValue> = {};
      Object.entries(state.values).forEach(([key, value]) => {
        if (key === name) return;
        if (key.startsWith(prefix)) {
          const shortKey = key.slice(prefix.length);
          result[shortKey] = value;
        }
      });
      return result;
    })
  );

  // Create setters
  const setters = useMemo(() => {
    const s: Record<string, (value: any) => void> = {};
    Object.keys(parsedSchema.values).forEach((path) => {
      if (path === name) return;
      if (path.startsWith(prefix)) {
        const key = path.slice(prefix.length);
        s[key] = (value: any) => store.setValue(path, value);
      }
    });
    return s;
  }, [name, schemaSignature, store]);

  // Return proxy object with nested structure
  return useMemo(() => {
    const result: Record<string, any> = {};
    
    // Build nested structure
    Object.keys(values).forEach((relativePath) => {
      const parts = relativePath.split(".");
      
      // Create nested path
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      const leafKey = parts[parts.length - 1];
      
      // Set value
      current[leafKey] = values[relativePath];
      
      // Add setter method
      if (setters[relativePath]) {
        current[`set${capitalize(leafKey)}`] = setters[relativePath];
      }
    });

    return result;
  }, [values, setters]);
}