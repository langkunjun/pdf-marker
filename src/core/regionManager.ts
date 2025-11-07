import { v4 as uuid } from 'uuid';
import { Region, RegionType, RegionStatus } from './types';

export const regionManager = {
  createRegion(
    pageIndex: number, 
    x: number, 
    y: number, 
    type: RegionType = 'rectangle',
    width = 120, 
    height = 80,
    status: RegionStatus = 'pending',
    scale = 1 // 标注时的缩放比例
  ): Region {
    return {
      id: uuid(),
      pageIndex,
      x,
      y,
      width,
      height,
      type,
      status,
      scale, // 记录缩放比例
    };
  },

  updateRegion(regions: Region[], id: string, partial: Partial<Region>) {
    return regions.map((r) => (r.id === id ? { ...r, ...partial } : r));
  },

  deleteRegion(regions: Region[], id: string) {
    return regions.filter((r) => r.id !== id);
  },

  validateRegion(region: Partial<Region>): string | null {
    if (!region.id || typeof region.id !== 'string') {
      return 'Region ID is required and must be a string';
    }
    if (region.pageIndex === undefined || region.pageIndex < 0) {
      return 'Page index is required and must be non-negative';
    }
    if (region.x === undefined || region.x < 0) {
      return 'X coordinate is required and must be non-negative';
    }
    if (region.y === undefined || region.y < 0) {
      return 'Y coordinate is required and must be non-negative';
    }
    if (region.width === undefined || region.width <= 0) {
      return 'Width is required and must be positive';
    }
    if (region.height === undefined || region.height <= 0) {
      return 'Height is required and must be positive';
    }
    return null;
  },
};
