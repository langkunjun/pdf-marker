import { useMarkerStore } from '../core/markerStore';


export const useCurrentFile = () => {
  const activeFileId = useMarkerStore((s) => s.activeFileId);
  const file = useMarkerStore((s) => (activeFileId ? s.files[activeFileId] : undefined));
  return file;
};

export const useFileRegions = (fileId: string) => {
  return useMarkerStore((s) => s.files[fileId]?.regions || []);
};
