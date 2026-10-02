export type EventMapPreviewHandle = {
  getContainer: () => HTMLElement | null;
  setAnimationProgress: (t: number) => void;
  setExportMode: (enabled: boolean) => void;
  waitForTiles: () => Promise<void>;
};
