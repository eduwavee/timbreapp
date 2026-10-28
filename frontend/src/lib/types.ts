export type Enum<T extends string = string> = { value: T; label: string };

export type Property = {
  id: number;
  code: string;
  type: Enum<"casa" | "departamento" | "galpon">;
  status: Enum<"disponible" | "ocupada" | "mantenimiento">;
  street: string;
  number: string;
  unit: string | null;
  city: string;
  address: string;
  surface_m2: string | null;
  rooms: number | null;
  notes: string | null;
  active_contract?: Contract | null;
  cover_url?: string | null;
  open_tickets_count?: number;
  balance?: number;
  created_at: string;
  updated_at: string;
};

export type Tenant = {
  id: number;
  first_name: string;
  last_name: string | null;
  full_name: string;
  document: string;
  phone: string;
  whatsapp_url: string;
  email: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  notes: string | null;
  has_portal_access?: boolean;
  active_contract?: Contract | null;
  balance?: number;
  created_at: string;
  updated_at: string;
};

export type Contract = {
  id: number;
  property_id: number;
  tenant_id: number;
  property?: Property;
  tenant?: Tenant;
  start_date: string;
  end_date: string;
  days_to_end: number;
  rent_amount: number;
  due_day: number;
  adjustment_type: Enum<"icl" | "ipc" | "fijo">;
  adjustment_every_months: number;
  deposit: number;
  late_fee_daily_pct: number;
  status: Enum<"vigente" | "finalizado" | "rescindido">;
  notes: string | null;
  installments?: Installment[];
  documents?: ContractDocument[];
  adjustments?: ContractAdjustment[];
  created_at: string;
  updated_at: string;
};

export type InstallmentStatus = "pendiente" | "parcial" | "vencida" | "pagada";

export type Installment = {
  id: number;
  contract_id: number;
  period: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  days_late: number;
  late_fee: number | null;
  status: Enum<InstallmentStatus>;
  paid_at: string | null;
  contract?: Contract;
  payments?: Payment[];
};

export type Payment = {
  id: number;
  receipt_number: number;
  amount: number;
  late_fee: number;
  total: number;
  paid_on: string;
  method: Enum<"efectivo" | "transferencia" | "mercadopago" | "otro">;
  reference: string | null;
  notes: string | null;
  installment?: Installment;
};

export type Provider = {
  id: number;
  name: string;
  trade: Enum;
  phone: string;
  notes: string | null;
  active: boolean;
  open_tickets_count?: number;
  created_at: string;
  updated_at: string;
};

export type TicketStatus = "abierto" | "derivado" | "en_curso" | "resuelto";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  category: Enum;
  priority: Enum<"baja" | "media" | "alta" | "urgente">;
  status: Enum<TicketStatus>;
  cost: number | null;
  created_at: string;
  derived_at: string | null;
  resolved_at: string | null;
  property?: Property;
  tenant?: Tenant | null;
  provider?: Provider | null;
  comments?: { id: number; body: string; author: string; is_admin: boolean; created_at: string }[];
  photos?: { id: number; url: string }[];
};

export type LedgerRow = {
  contract_id: number;
  property: { id: number; code: string; address: string; type: string };
  tenant: { id: number; name: string; phone: string };
  previous_balance: number;
  month_amount: number;
  month_paid: number;
  late_fees: number;
  total_due: number;
  overdue_count: number;
  days_late: number;
  stage: Enum<InstallmentStatus> | null;
  current_installment_id: number | null;
  due_date: string | null;
  action_installment_id: number | null;
  whatsapp_url: string | null;
  pending_proofs: number;
  last_reminder_at: string | null;
};

export type Ledger = {
  period: string;
  period_label: string;
  totals: { expected: number; collected: number; owed: number; debtors: number; units: number };
  rows: LedgerRow[];
};

export const TRADES: Enum[] = [
  { value: "plomeria", label: "Plomería" },
  { value: "electricidad", label: "Electricidad" },
  { value: "gas", label: "Gas" },
  { value: "cerrajeria", label: "Cerrajería" },
  { value: "pintura", label: "Pintura" },
  { value: "albanileria", label: "Albañilería" },
  { value: "general", label: "General" },
];

export const PRIORITIES: Enum[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export const PAYMENT_METHODS: Enum[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "otro", label: "Otro" },
];

export type Proof = {
  id: number;
  amount: number;
  paid_on: string;
  method: Enum;
  status: Enum<"pendiente" | "aprobado" | "rechazado">;
  note: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  file_url: string;
  is_pdf: boolean;
  tenant: { id: number; name: string } | null;
  installment: { id: number; period: string; balance: number; property_code: string | null };
  payment_id: number | null;
  receipt_number: number | null;
};

export type Expense = {
  id: number;
  property: { id: number; code: string; address: string };
  category: Enum;
  description: string;
  amount: number;
  spent_on: string;
  ticket_id: number | null;
};

export type ContractDocument = {
  id: number;
  kind: Enum;
  name: string;
  mime: string;
  size: number;
  expires_on: string | null;
  days_to_expire: number | null;
  created_at: string;
  file_url: string;
};

export type Photo = { id: number; url: string; caption: string | null };

export type ActivityEvent = { kind: "pago" | "aviso" | "derivacion" | "reclamo" | "resuelto" | "comprobante" | "consulta" | "cambio"; at: string; title: string; detail: string; href: string | null };

export type AgendaEvent = { date: string; kind: "vencimiento" | "fin_contrato" | "ajuste" | "documento"; title: string; detail: string; tone: "ok" | "debt" | "ink" | "stamp"; href: string; units: string[] };

export const EXPENSE_CATEGORIES: Enum[] = [
  { value: "arreglo", label: "Arreglo" },
  { value: "abl", label: "ABL" },
  { value: "expensas", label: "Expensas" },
  { value: "seguro", label: "Seguro" },
  { value: "impuesto", label: "Impuesto" },
  { value: "servicio", label: "Servicio" },
  { value: "otro", label: "Otro" },
];

export const DOCUMENT_KINDS: Enum[] = [
  { value: "contrato", label: "Contrato firmado" },
  { value: "dni", label: "DNI" },
  { value: "garantia", label: "Garantía" },
  { value: "recibo_sueldo", label: "Recibo de sueldo" },
  { value: "seguro", label: "Seguro" },
  { value: "otro", label: "Otro" },
];

/* ───────────── Brunito (web pública) ───────────── */

export type Listing = {
  id: number;
  property_id: number;
  slug: string;
  headline: string;
  description: string | null;
  neighborhood: string | null;
  for_sale: boolean;
  sale_price: number | null;
  for_rent: boolean;
  rent_price: number | null;
  expenses: number | null;
  bathrooms: number | null;
  garage: boolean;
  age_years: number | null;
  amenities: string[];
  published: boolean;
  published_at: string | null;
  reserved: boolean;
  public_url: string;
  open_inquiries_count?: number;
};

export type Colleague = {
  id: number;
  name: string;
  agency: string | null;
  phone: string;
  zone: string | null;
  notes: string | null;
  active: boolean;
  open_inquiries_count?: number;
  created_at: string;
  updated_at: string;
};

export type InquiryStatus = "nueva" | "atendiendo" | "derivada" | "cerrada";

export type Inquiry = {
  id: number;
  operation: Enum<"venta" | "alquiler">;
  status: Enum<InquiryStatus>;
  outcome: Enum<"concretada" | "descartada"> | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  notes: string | null;
  created_at: string;
  contacted_at: string | null;
  derived_at: string | null;
  closed_at: string | null;
  colleague?: Colleague | null;
  property?: { id: number; code: string; address: string; city: string; type: Enum; status: Enum; cover_url: string | null };
  listing?: { id: number; slug: string; headline: string; place: string; price_label: string; reserved: boolean; public_url: string };
  reply_url?: string;
};

export const INQUIRY_STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: "nueva", label: "Nuevas" },
  { value: "atendiendo", label: "Las atendés vos" },
  { value: "derivada", label: "Derivadas" },
  { value: "cerrada", label: "Cerradas" },
];

/** Una entrada del historial de una ficha: el alta o una edición con el antes y el después. */
export type ChangeEntry = { id: number; event: "alta" | "cambio"; changes: { label: string; from: string; to: string }[]; user: string | null; at: string };

export type ContractAdjustment = { id: number; from_period: string; previous_amount: number; new_amount: number; percentage: number; basis: string | null; created_at: string };

/** Un ajuste ICL o IPC que toca aplicar, ya calculado con los índices oficiales. */
export type AdjustmentSuggestion = {
  contract_id: number;
  property: { id: number; code: string; address: string };
  tenant: { id: number; name: string };
  index: string;
  every_months: number;
  date: string;
  days: number;
  from_period: string;
  previous_amount: number;
  ready: boolean;
  percentage: number | null;
  new_amount: number | null;
  provisional: boolean;
  basis: string | null;
};
