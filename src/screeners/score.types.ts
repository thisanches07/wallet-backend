import { AssetClass } from '../positions/asset-class.enum';

export interface RecommendationItem {
  id: string;
  name: string;
  class: AssetClass;
  score: number;
  rationale: string[];
  metrics: Record<string, number | string | null>;
  source: string;
  updatedAt: string;
}

export interface RecommendationScore {
  assetId: string;
  score: number;
  factors: MetricMap;
}

export interface MetricMap {
  [key: string]: number | string | null;
}
