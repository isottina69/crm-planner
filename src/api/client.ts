import { CrmConfig } from '../config/crms';
import { ApiResponse, Event, Contact, Booking } from './types';

async function apiGet<T>(
  crm: CrmConfig,
  path: string,
  params: Record<string, any> = {}
): Promise<ApiResponse<T>> {
  const url = new URL(path, crm.baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': crm.apiKey
    }
  });

  return (await res.json()) as ApiResponse<T>;
}

export const Api = {
  getEvents(
    crm: CrmConfig,
    options: { date: string; view?: string; resourceId?: string }
  ) {
    return apiGet<Event[]>(crm, '/mobile/events', options);
  },

  getEventById(crm: CrmConfig, id: string) {
    return apiGet<Event>(crm, `/mobile/events/${id}`);
  },

  getContacts(
    crm: CrmConfig,
    options: { search?: string; page?: number; pageSize?: number }
  ) {
    return apiGet<Contact[]>(crm, '/mobile/contacts', options);
  },

  getBookings(
    crm: CrmConfig,
    options: { from: string; to: string; unitId?: string }
  ) {
    return apiGet<Booking[]>(crm, '/mobile/bookings', options);
  }
};
