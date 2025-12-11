import { AssetClass } from '../positions/asset-class.enum';

export const TARGET_ALLOCATION: Record<AssetClass, number> = {
  [AssetClass.FIXED_INCOME]: 38,
  [AssetClass.EQUITIES_BR]: 18,
  [AssetClass.INTL]: 18,
  [AssetClass.FIIS]: 13,
  [AssetClass.CRYPTO]: 8,
  [AssetClass.CASH]: 5,
};

export const REBALANCE_BAND_THRESHOLD = 2.5; // percentage points
