export interface PluggyInvestmentResponse {
  id: string;
  itemId: string;
  name: string;
  code?: string;
  isin?: string;
  number?: string;
  owner?: string;
  currencyCode?: string;
  type: string;
  subtype?: string;
  lastMonthRate?: number;
  lastTwelveMonthsRate?: number;
  annualRate?: number;
  date?: string;
  value?: number;
  quantity?: number;
  amount: number;
  taxes?: number;
  taxes2?: number;
  balance?: number;
  dueDate?: string;
  rate?: number;
  rateType?: string;
  fixedAnnualRate?: number;
  issuer?: string;
  issueDate?: string;
  amountProfit?: number;
  amountWithdrawal?: number;
  amountOriginal?: number;
  status?: string;
  providerId?: string;

  institution?: {
    name?: string;
    number?: string;
    insurer?: {
      cnpj: string;
      name: string;
    };
  };

  metadata?: {
    taxRegime?: string;
    proposalNumber?: string;
    processNumber?: string;
    fundName?: string;
    insurer?: {
      cnpj: string;
      name: string;
    };
  };

  // Apenas se ainda estiver vindo (legacy)
  transactions?: {
    id?: string;
    amount: number;
    description?: string;
    value: number;
    quantity: number;
    tradeDate: string;
    date: string;
    type: 'BUY' | 'SELL';
    netAmount?: number;
    brokerageNumber?: string;
    expenses?: {
      serviceTax?: number;
      brokerageFee?: number;
      incomeTax?: number;
      other?: number;
      tradingAssetsNoticeFee?: number;
      maintenanceFee?: number;
      settlementFee?: number;
      clearingFee?: number;
      stockExchangeFee?: number;
      custodyFee?: number;
      operatingFee?: number;
    };
  }[];
}
