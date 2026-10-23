export type Enum<T extends string = string> = { value: T; label: string };

export type Op = "venta" | "alquiler";

export type Operation = { value: Op; label: string; verb: string; currency: "USD" | "ARS"; price: number | null };

export type Photo = { url: string; caption: string | null };

export type ListingSummary = {
  slug: string;
  code: string;
  headline: string;
  type: Enum<"casa" | "departamento" | "galpon">;
  operations: Operation[];
  expenses: number | null;
  rooms: number | null;
  surface_m2: number | null;
  bathrooms: number | null;
  garage: boolean;
  age_years: number | null;
  neighborhood: string | null;
  city: string;
  place: string;
  address_hint: string;
  reserved: boolean;
  published_at: string | null;
  cover: Photo | null;
  photo_count: number;
};

export type ListingDetail = ListingSummary & {
  description: string | null;
  amenities: Enum[];
  photos: Photo[];
};

export type Place = { name: string; city: string; venta: number; alquiler: number };

export type Meta = {
  site_name: string;
  owner_name: string;
  owner_phone: string | null;
  counts: Record<Op, number>;
  places: Place[];
  types: { value: string; label: string; count: number }[];
};

export type Filters = { op: Op; place?: string; type?: string; rooms?: string; max_price?: string; sort?: string };
