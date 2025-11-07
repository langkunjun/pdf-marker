import React, { memo, useCallback } from 'react';
import { useMarkerStore } from '../core/markerStore';

// 兼容 React 16 / Webpack 4：react-rnd 可能只有默认导出
declare const require: any;
const Rnd = require('react-rnd');
const RndComponent = (Rnd.default || Rnd) as React.ComponentType<any>;

interface Props {
  fileId: string;
  scale?: number;
  onRegionClick?: (regionId: string) => void;
  onRegionDelete?: (regionId: string) => void;
  isEditing?: boolean; // 是否在编辑模式（添加/调整区域时禁用点击）
  filterPageIndex?: number; // 仅渲染指定页面的区域
  readOnly?: boolean; // 只读模式，禁用拖拽/缩放
}

export const RegionLayer: React.FC<Props> = memo(({ fileId, scale = 1, onRegionClick, isEditing = false, onRegionDelete, filterPageIndex, readOnly = false }) => {
  const regions = useMarkerStore((s) => s.files[fileId]?.regions || []);
  // 当传入 filterPageIndex 时，仅渲染该页的区域
  const displayRegions = typeof filterPageIndex === 'number' ? regions.filter(r => r.pageIndex === filterPageIndex) : regions;

  const handleDragStop = useCallback((regionId: string, x: number, y: number) => {
    const { updateRegion } = useMarkerStore.getState();
    updateRegion(fileId, regionId, { x, y, scale });
  }, [fileId, scale]);

  const handleResizeStop = useCallback((regionId: string, width: number, height: number, x: number, y: number) => {
    const { updateRegion } = useMarkerStore.getState();
    updateRegion(fileId, regionId, { width, height, x, y, scale });
  }, [fileId, scale]);

  const handleClick = useCallback((e: React.MouseEvent, regionId: string) => {
    // 如果在编辑模式，不触发点击事件
    if (isEditing) return;
    e.stopPropagation();
    onRegionClick?.(regionId);
  }, [isEditing, onRegionClick]);

  return (
    <>
      {displayRegions.map((r) => (
        readOnly ? (
          <div
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x * scale,
            top: r.y * scale,
            width: r.width * scale,
            height: r.height * scale,
            border: `2px dashed ${getRegionColor(r.status)}`,
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={(e:any) => handleClick(e, r.id)}
        >
          {/* 在只读模式下显示图片：按等比包含策略渲染到区域内 */}
          {r.meta?.imageSrc && (
            <img
              src={r.meta.imageSrc}
              alt="region-image"
              style={{
                position: 'absolute',
                left: (r.meta.imageFit?.offsetX || 0) * scale,
                top: (r.meta.imageFit?.offsetY || 0) * scale,
                width: (r.meta.imageFit?.width || 0) * scale,
                height: (r.meta.imageFit?.height || 0) * scale,
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        ) : (
        <RndComponent
          key={r.id}
          size={{ width: r.width * scale, height: r.height * scale }}
          position={{ x: r.x * scale, y: r.y * scale }}
          onDragStop={(e: any, d: any) => handleDragStop(r.id, d.x / scale, d.y / scale)}
          onResizeStop={(e: any, dir: any, ref: any, delta: any, pos: any) =>
            handleResizeStop(
              r.id,
              parseFloat(ref.style.width) / scale,
              parseFloat(ref.style.height) / scale,
              pos.x / scale,
              pos.y / scale
            )
          }
          onClick={(e:any) => handleClick(e, r.id)}
          bounds="parent"
          style={{
            border: `2px dashed ${getRegionColor(r.status)}`,
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            cursor: 'move',
            position: 'absolute',
            overflow: 'hidden',
          }}
        >
          {/* 在可编辑模式下也显示图片（但不响应事件），便于预览 */}
          {r.meta?.imageSrc && (
            <img
              src={r.meta.imageSrc}
              alt="region-image"
              style={{
                position: 'absolute',
                left: (r.meta.imageFit?.offsetX || 0) * scale,
                top: (r.meta.imageFit?.offsetY || 0) * scale,
                width: (r.meta.imageFit?.width || 0) * scale,
                height: (r.meta.imageFit?.height || 0) * scale,
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegionDelete?.(r.id); // 传递删除事件
            }}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              border: '2px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              zIndex: 10,
            }}
            title="删除"
          >
            ×
          </button>
        </RndComponent>
        )
      ))}
    </>
  );
});

const getRegionColor = (status: string) => {
  switch (status) {
    case 'done': return '#22c55e';
    case 'active': return '#3b82f6';
    default: return '#f59e0b';
  }
};

RegionLayer.displayName = 'RegionLayer';
