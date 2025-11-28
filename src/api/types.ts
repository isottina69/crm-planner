export interface ApiError {
  code: string;
  message: string;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: ApiMeta;
  error?: ApiError | null;
}

// Resource
export type ResourceType = 'studio' | 'apartment' | 'room' | 'staff' | 'generic';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  color?: string | null;
}

// Contact
export interface EventContactInfo {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

// Event
export type EventStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type EventKind   = 'appointment' | 'booking' | 'shift' | 'generic';

export interface Event {
  id: string;
  crmRecordId: string;
  crmModule: string;
  title: string;
  description?: string | null;
  start: string;
  end: string;
  allDay?: boolean;
  status?: EventStatus;
  kind?: EventKind;
  location?: string | null;
  resource?: Resource | null;
  contact?: EventContactInfo;
  tags?: string[];
  extra?: Record<string, any>;
}

// Contact
export interface Contact {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  documentId?: string | null;
  city?: string | null;
  country?: string | null;
  extra?: Record<string, any>;
}

// Booking
export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export interface Booking {
  id: string;
  crmRecordId: string;
  crmModule: string;
  unit: Resource;
  guest: EventContactInfo;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  totalPrice?: number;
  notes?: string | null;
  extra?: Record<string, any>;
}
