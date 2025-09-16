import { useCallback, useEffect, useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import type { ControlValue } from "../core/useControls";
import { useXrevaStore } from "../core/useControls";

type StoreState = ReturnType<typeof useXrevaStore.getState>;
type ControlData = ReturnType<StoreState["getAllControls"]>[number];

interface FolderInfo {
  key: string;
  path: string;
  config?: Record<string, unknown>;
  controls: ControlData[];
}

interface PanelStructure {
  topLevelControls: ControlData[];
  folders: FolderInfo[];
}

function controlsArrayEquality(a: ControlData[], b: ControlData[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export interface PanelState {
  values: Record<string, ControlValue>;
  setValue: (path: string, value: ControlValue) => void;
  topLevelControls: ControlData[];
  folders: FolderInfo[];
  activeTab: string | null;
  setActiveTab: (tab: string) => void;
  clearActiveTab: () => void;
}

export function usePanelState(tabsEnabled: boolean): PanelState {
  const controls = useXrevaStore(
    useCallback((state) => {
      return state.getAllControls();
    }, []),
    controlsArrayEquality,
  );
  const values = useXrevaStore((state) => state.values, shallow);
  const setValue = useXrevaStore((state) => state.setValue);

  const structure = useMemo<PanelStructure>(() => {
    const topLevelControls: ControlData[] = [];
    const folderMap = new Map<string, FolderInfo>();

    controls.forEach((control) => {
      const pathStr = control.path.join(".");
      if (control.path.length === 2 && control.type !== "folder") {
        topLevelControls.push(control);
        return;
      }

      if (control.type === "folder" && control.path.length === 2) {
        folderMap.set(pathStr, {
          key: control.key,
          path: pathStr,
          config: control.config as Record<string, unknown>,
          controls: [],
        });
        return;
      }

      if (control.path.length > 2) {
        const parentPath = control.path.slice(0, -1).join(".");
        const folder = folderMap.get(parentPath);
        if (folder) {
          folder.controls.push(control);
        }
      }
    });

    // Ensure folder controls maintain insertion order
    const folders = Array.from(folderMap.values());
    folders.forEach((folder) => {
      folder.controls.sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));
    });

    return { topLevelControls, folders };
  }, [controls]);

  const [activeTab, setActiveTabState] = useState<string | null>(null);

  useEffect(() => {
    if (!tabsEnabled) {
      if (activeTab !== null) {
        setActiveTabState(null);
      }
      return;
    }

    if (structure.folders.length === 0) {
      if (activeTab !== null) {
        setActiveTabState(null);
      }
      return;
    }

    const isActiveValid = structure.folders.some((folder) => folder.key === activeTab);
    if (!isActiveValid) {
      const nextTab = structure.folders[0]?.key ?? null;
      if (nextTab !== activeTab) {
        setActiveTabState(nextTab);
      }
    }
  }, [tabsEnabled, structure.folders, activeTab]);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
  }, []);

  const clearActiveTab = useCallback(() => {
    setActiveTabState(null);
  }, []);

  return {
    values,
    setValue,
    topLevelControls: structure.topLevelControls,
    folders: structure.folders,
    activeTab,
    setActiveTab,
    clearActiveTab,
  };
}
