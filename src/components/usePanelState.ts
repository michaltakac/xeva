import { useCallback, useEffect, useMemo, useState } from "react";
import type { ControlValue } from "../core/useControls";
import { useXrevaStore } from "../core/useControls";
import { useShallow } from 'zustand/react/shallow';

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
  // Use selectors to only subscribe to what we need
  const controls = useXrevaStore(state => state.controlsArray);
  const folders = useXrevaStore(state => state.folders);
  const values = useXrevaStore(useShallow(state => state.values));
  const setValue = useXrevaStore(state => state.setValue);
  
  // Structure computation
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
          config: control.config as any,
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
    const foldersList = Array.from(folderMap.values());
    foldersList.forEach((folder) => {
      folder.controls.sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));
    });

    return { topLevelControls, folders: foldersList };
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