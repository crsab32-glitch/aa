export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  cnhNumber: string;
  validityDate: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  renavam: string;
  chassis: string;
  brand: string;
  model: string;
  year: number;
}

export interface DetranCode {
  id: string;
  code: string;
  description: string;
  defaultValue: number;
  defaultPoints: number;
}

export interface Fine {
  id: string;
  driverId?: string;
  driverName?: string;
  plate: string;
  autoInfraction: string;
  date: string;
  code: string;
  description: string;
  value: number;
  organ: string;
  indicatesDriver: boolean;
  location: string;
  points: number;
  payDouble: boolean;
  observations: string;
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELED';
  fileData?: string;      // Base64 do arquivo original
  fileMimeType?: string;  // Tipo do arquivo (application/pdf, image/jpeg, etc)
}

export type AppView = 'drivers' | 'vehicles' | 'detran' | 'fines_entry' | 'fines_list' | 'fines_search';