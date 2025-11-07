import React from 'react';
import { useMarkerStore } from '../core/markerStore';

// 兼容 zustand 4.x：shallow 可能在不同路径
declare const require: any;

// 定义 shallow 比较函数的类型
type ShallowSelector = <T>(selector: (state: any) => T) => (state: any) => T;

let useShallow: ShallowSelector;
try {
  useShallow = require('zustand/shallow');
} catch {
  try {
    useShallow = require('zustand/react/shallow');
  } catch {
    // 如果都不存在，使用简单的相等比较（返回原函数）
    useShallow = <T,>(fn: (state: any) => T) => fn as any;
  }
}

interface FileTabsProps {
  onFileSwitch?: (fileId: string) => void;
}

export const FileTabs: React.FC<FileTabsProps> = ({ onFileSwitch }) => {
  // 使用 useShallow 比较来避免不必要的重渲染
  const selectorResult = useMarkerStore(
    useShallow((s: any) => ({
      activeFileId: s.activeFileId,
      files: s.files,
    }))
  ) as { activeFileId?: string; files: Record<string, any> };
  
  const { activeFileId, files } = selectorResult;
  const filesArray = Object.keys(files).map((key) => files[key]);

  const handleSwitchFile = (fileId: string) => {
    const { switchFile } = useMarkerStore.getState();
    switchFile(fileId);
    onFileSwitch?.(fileId);
  };

  if (!filesArray.length) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {filesArray.map((f: any) => (
        <button
          key={f.id}
          onClick={() => handleSwitchFile(f.id)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: f.id === activeFileId ? '#3b82f6' : '#e5e7eb',
            color: f.id === activeFileId ? 'white' : '#4b5563',
            fontWeight: f.id === activeFileId ? '500' : '400',
          }}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
};
