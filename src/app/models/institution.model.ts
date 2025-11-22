export enum InstitutionType {
  BANK = 'BANK',
  BROKER = 'BROKER'
}

export const InstitutionTypeLabels: Record<InstitutionType, string> = {
  [InstitutionType.BANK]: 'Banco',
  [InstitutionType.BROKER]: 'Corretora'
};

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  createdAt: Date;
  updatedAt: Date;
}
