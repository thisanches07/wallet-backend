import { AssetClass } from '../../positions/asset-class.enum';
import { ClassifiedPosition } from '../../positions/types';

export function calculateAllocation(
  positions: ClassifiedPosition[],
): Record<AssetClass, number> {
  const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);

  if (totalValue === 0) {
    return Object.values(AssetClass).reduce(
      (acc, cls) => {
        acc[cls] = 0;
        return acc;
      },
      {} as Record<AssetClass, number>,
    );
  }

  const allocation: Record<AssetClass, number> = Object.values(
    AssetClass,
  ).reduce(
    (acc, cls) => {
      acc[cls] = 0;
      return acc;
    },
    {} as Record<AssetClass, number>,
  );

  positions.forEach((pos) => {
    allocation[pos.class] = (pos.totalValue / totalValue) * 100;
  });

  return allocation;
}

export function calculateGaps(
  current: Record<AssetClass, number>,
  target: Record<AssetClass, number>,
): Record<AssetClass, number> {
  const gaps: Record<AssetClass, number> = {} as Record<AssetClass, number>;

  Object.values(AssetClass).forEach((cls) => {
    gaps[cls] = target[cls] - current[cls];
  });

  return gaps;
}

export function getActionableClasses(
  gaps: Record<AssetClass, number>,
  threshold: number,
): AssetClass[] {
  return Object.entries(gaps)
    .filter(([, gap]) => Math.abs(gap) >= threshold)
    .map(([cls]) => cls as AssetClass);
}
