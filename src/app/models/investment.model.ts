export enum InvestmentType {
  // Renda Fixa
  PREVIDENCIA = 'PREVIDENCIA',
  TESOURO = 'TESOURO',
  CDB = 'CDB',
  LCI_LCA = 'LCI_LCA',
  DEBENTURES = 'DEBENTURES',
  LETRAS_CAMBIO = 'LETRAS_CAMBIO',

  // Renda Variável
  ACOES = 'ACOES',
  ETFS = 'ETFS',
  FUNDO_ACOES = 'FUNDO_ACOES',
  BDRS = 'BDRS',
  CRIPTOMOEDAS = 'CRIPTOMOEDAS',

  // Fundos de Investimento
  FUNDO_DI = 'FUNDO_DI',
  FUNDO_MULTIMERCADO = 'FUNDO_MULTIMERCADO',
  FUNDO_CAMBIAL = 'FUNDO_CAMBIAL',
  FII = 'FII',

  // Câmbio e Moedas Estrangeiras
  DOLAR = 'DOLAR',
  FUNDOS_CAMBIAIS = 'FUNDOS_CAMBIAIS',
  ETFS_INTERNACIONAIS = 'ETFS_INTERNACIONAIS',
  REITS = 'REITS'
}

export const InvestmentTypeLabels: Record<InvestmentType, string> = {
  [InvestmentType.PREVIDENCIA]: 'Previdência',
  [InvestmentType.TESOURO]: 'Tesouro',
  [InvestmentType.CDB]: 'CDB',
  [InvestmentType.LCI_LCA]: 'LCI/LCA',
  [InvestmentType.DEBENTURES]: 'Debêntures',
  [InvestmentType.LETRAS_CAMBIO]: 'Letras de Câmbio',
  [InvestmentType.ACOES]: 'Ações',
  [InvestmentType.ETFS]: 'ETFs',
  [InvestmentType.FUNDO_ACOES]: 'Fundo de Ações',
  [InvestmentType.BDRS]: 'BDRs',
  [InvestmentType.CRIPTOMOEDAS]: 'Criptomoedas',
  [InvestmentType.FUNDO_DI]: 'Fundo DI',
  [InvestmentType.FUNDO_MULTIMERCADO]: 'Fundo Multimercado',
  [InvestmentType.FUNDO_CAMBIAL]: 'Fundo Cambial',
  [InvestmentType.FII]: 'FII',
  [InvestmentType.DOLAR]: 'Dólar',
  [InvestmentType.FUNDOS_CAMBIAIS]: 'Fundos Cambiais',
  [InvestmentType.ETFS_INTERNACIONAIS]: 'ETFs Internacionais',
  [InvestmentType.REITS]: 'REITs'
};

export const InvestmentCategories = {
  'Renda Fixa': [
    InvestmentType.PREVIDENCIA,
    InvestmentType.TESOURO,
    InvestmentType.CDB,
    InvestmentType.LCI_LCA,
    InvestmentType.DEBENTURES,
    InvestmentType.LETRAS_CAMBIO
  ],
  'Renda Variável': [
    InvestmentType.ACOES,
    InvestmentType.ETFS,
    InvestmentType.FUNDO_ACOES,
    InvestmentType.BDRS,
    InvestmentType.CRIPTOMOEDAS
  ],
  'Fundos de Investimento': [
    InvestmentType.FUNDO_DI,
    InvestmentType.FUNDO_MULTIMERCADO,
    InvestmentType.FUNDO_CAMBIAL,
    InvestmentType.FII
  ],
  'Câmbio e Moedas Estrangeiras': [
    InvestmentType.DOLAR,
    InvestmentType.FUNDOS_CAMBIAIS,
    InvestmentType.ETFS_INTERNACIONAIS,
    InvestmentType.REITS
  ]
};

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR'
}

export const CurrencyLabels: Record<Currency, string> = {
  [Currency.BRL]: 'R$',
  [Currency.USD]: 'US$',
  [Currency.EUR]: '€'
};

export interface Investment {
  id: string;
  name: string;
  institutionId?: string; // ID do banco ou corretora (opcional para compatibilidade)
  type: InvestmentType;
  currency: Currency;
  startDate: Date;
  initialValue: number;
  comments?: string; // Comentários/observações sobre o investimento
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',      // Aporte
  WITHDRAWAL = 'WITHDRAWAL', // Saque
  BALANCE_UPDATE = 'BALANCE_UPDATE' // Atualização de saldo
}

export interface Transaction {
  id: string;
  investmentId: string;
  date: Date;
  type: TransactionType;
  amount: number;
  balance?: number; // Saldo após a transação (para BALANCE_UPDATE)
  description?: string;
}

export interface PerformanceMetrics {
  totalInvested: number;
  currentBalance: number;
  totalReturn: number;
  returnPercentage: number;
  periodStart: Date;
  periodEnd: Date;
}
