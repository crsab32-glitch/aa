import { Driver, Vehicle, Fine, DetranCode, User } from '../types';

const KEYS = {
  DRIVERS: 'fg_drivers',
  VEHICLES: 'fg_vehicles',
  FINES: 'fg_fines',
  DETRAN: 'fg_detran',
  USERS: 'fg_users',
  CURRENT_USER: 'fg_session'
};

// Helper para leitura segura
const safeGet = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Erro ao ler ${key} do localStorage`, e);
    return defaultValue;
  }
};

// --- Auth ---
export const saveUser = (user: User): boolean => {
  const users = getUsers();
  if (users.some(u => u.username === user.username)) return false;
  localStorage.setItem(KEYS.USERS, JSON.stringify([...users, user]));
  return true;
};

export const getUsers = (): User[] => safeGet(KEYS.USERS, []);

export const login = (username: string, pass: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === pass);
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => safeGet(KEYS.CURRENT_USER, null);

export const logout = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

// --- Drivers ---
export const getDrivers = (): Driver[] => safeGet(KEYS.DRIVERS, []);

export const saveDriver = (driver: Driver): boolean => {
  const drivers = getDrivers();
  if (drivers.some(d => d.cpf === driver.cpf)) return false;
  localStorage.setItem(KEYS.DRIVERS, JSON.stringify([...drivers, driver]));
  return true;
};

export const updateDriver = (driver: Driver): void => {
  const drivers = getDrivers();
  const index = drivers.findIndex(d => d.id === driver.id);
  if (index !== -1) {
    drivers[index] = driver;
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers));
  }
};

// --- Vehicles ---
export const getVehicles = (): Vehicle[] => safeGet(KEYS.VEHICLES, []);

export const saveVehicle = (vehicle: Vehicle): boolean => {
  const vehicles = getVehicles();
  if (vehicles.some(v => v.plate === vehicle.plate)) return false;
  localStorage.setItem(KEYS.VEHICLES, JSON.stringify([...vehicles, vehicle]));
  return true;
};

export const updateVehicle = (vehicle: Vehicle): void => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicle.id);
  if (index !== -1) {
    vehicles[index] = vehicle;
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
  }
};

// --- Detran Codes ---
export const getDetranCodes = (): DetranCode[] => safeGet(KEYS.DETRAN, []);

export const saveDetranCode = (code: DetranCode): boolean => {
  const codes = getDetranCodes();
  if (codes.some(c => c.code === code.code)) return false; 
  localStorage.setItem(KEYS.DETRAN, JSON.stringify([...codes, code]));
  return true;
};

export const findDetranCode = (codeStr: string): DetranCode | undefined => {
  return getDetranCodes().find(c => c.code === codeStr);
};

// --- Fines ---
export const getFines = (): Fine[] => safeGet(KEYS.FINES, []);

export const saveFine = (fine: Fine): boolean => {
  const fines = getFines();
  if (fines.some(f => f.autoInfraction === fine.autoInfraction)) return false;
  localStorage.setItem(KEYS.FINES, JSON.stringify([...fines, fine]));
  return true;
};

export const updateFine = (fine: Fine): void => {
  const fines = getFines();
  const index = fines.findIndex(f => f.id === fine.id);
  if (index !== -1) {
    fines[index] = fine;
    localStorage.setItem(KEYS.FINES, JSON.stringify(fines));
  }
};