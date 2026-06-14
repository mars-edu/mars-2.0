

export interface Cabinet {
  id: string;
  name: string;
  capacity: number;
  type: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface AddCabinetPayload {
  name: string;
  capacity: number;
  type: string;
  description?: string;
}
