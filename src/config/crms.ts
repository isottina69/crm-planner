export type LabelSet = {
  contactSingular: string;
  contactPlural: string;
  eventSingular: string;
  eventPlural: string;
};

export interface CrmConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  labels: LabelSet;
}

export const CRMS: CrmConfig[] = [
  {
    id: 'dietista',
    name: 'CRM Dietista',
    baseUrl: 'https://dietista.mioserver.it',
    apiKey: 'CAMBIA_QUESTA_API_KEY',
    labels: {
      contactSingular: 'Paziente',
      contactPlural: 'Pazienti',
      eventSingular: 'Appuntamento',
      eventPlural: 'Appuntamenti'
    }
  }
];
