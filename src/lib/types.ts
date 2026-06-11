export type UserRole = "admin" | "depo" | "viewer" | "operasyon" | "operasyon_takip";
export type PricingBasis = "tonnage" | "vehicle";

export interface Warehouse {
  id: string;
  name: string;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface CarrierContact {
  name: string;
  role: string;
  phone: string;
}

export interface Carrier {
  id: string;
  name: string;
  active: boolean;
  contacts: CarrierContact[];
  contract_path: string | null;
  created_at: string;
}

export interface CarrierTotal {
  carrier_id: string;
  shipment_count: number;
  total_tonnage: number;
  total_paid: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  warehouse_id: string | null;
  active: boolean;
  created_at: string;
}

export interface StockEntry {
  id: string;
  warehouse_id: string;
  product_id: string;
  tonnage: number;
  entry_date: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  warehouse_id: string;
  product_id: string;
  destination_id: string | null;
  carrier_id: string | null;
  vehicle_plate: string;
  tonnage: number;
  shipment_date: string;
  shipment_time: string;
  driver_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PricingAgreement {
  id: string;
  warehouse_id: string;
  destination_id: string | null;
  carrier_id: string | null;
  basis: PricingBasis;
  unit_price: number;
  valid_from: string;
  valid_to: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StorageRate {
  id: string;
  warehouse_id: string;
  price_per_ton_per_day: number;
  valid_from: string;
  valid_to: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockBalance {
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  total_in: number;
  total_out: number;
  remaining_tonnage: number;
}

export interface DailyStorageCostToday {
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  remaining_tonnage: number;
  rate_per_ton: number;
  storage_cost: number;
}

export interface ShipmentCost {
  shipment_id: string;
  warehouse_id: string;
  product_id: string;
  destination_id: string | null;
  carrier_id: string | null;
  vehicle_plate: string;
  tonnage: number;
  shipment_date: string;
  basis: PricingBasis | null;
  unit_price: number | null;
  transport_cost: number | null;
}

export interface StorageCostPeriodRow {
  day: string;
  product_id: string;
  product_name: string;
  remaining_tonnage: number;
  rate_per_ton: number;
  storage_cost: number;
}

export interface WarehouseTotal {
  warehouse_id: string;
  warehouse_name: string;
  total_remaining_tonnage: number;
}

export interface TodayShipmentsSummary {
  warehouse_id: string;
  warehouse_name: string;
  shipment_count: number;
  total_tonnage: number;
}
