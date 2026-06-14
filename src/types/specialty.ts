

export interface Specialty {
  id: string;
  legacyId?: string;
  name: string;
  codeName: string;
  code: string;
  year?: number;
  orderNumber?: string;
  hasModule: boolean;
  createdAt: Date;
  updatedAt: Date;
  details: string;
  isHighlighted?: boolean;
}


export interface AddSpecialtyPayload {
  code: string;
  name: string;
  details: string;
  codeName: string;
  year?: number;
  orderNumber?: string;
}
