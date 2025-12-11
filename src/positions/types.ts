import { AssetClass } from './asset-class.enum';

export interface Holding {
  userId: string;
  assetId: string;
  class: AssetClass;
  qty: number;
  lastPrice: number;
}

export interface Asset {
  id: string;
  name: string;
  class: AssetClass;
  ticker?: string;
  price?: number;
}

export interface ClassifiedPosition {
  class: AssetClass;
  totalValue: number;
  holdings: Holding[];
}
