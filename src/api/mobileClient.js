// src/api/mobileClient.js

// 👉 Config hardcoded per CRM Dietista
const BASE_URL = "http://212.132.75.68";
const API_KEY = "dietista-API-123456";

// -----------------------------------------------------
// Helper di base
// -----------------------------------------------------

/**
 * Controlla che la configurazione sia presente.
 */
function ensureConfig() {
  if (!BASE_URL || !API_KEY) {
    throw new Error(
      "Config API mancante: BASE_URL o API_KEY vuote in mobileClient.js"
    );
  }
}

/**
 * Gestisce la risposta JSON standard del backend:
 * { success: true/false, data: ..., error: { code, message } }
 */
async function handleJsonResponse(res, labelErrore) {
  let json;

  try {
    json = await res.json();
  } catch (e) {
    console.log(labelErrore + " - JSON non valido:", e);
    throw new Error(labelErrore + " - risposta non valida dal server");
  }

  if (!json.success) {
    console.log(labelErrore + " - risposta server:", json);
    const msg =
      (json.error && json.error.message) ||
      json.message ||
      labelErrore ||
      "Errore sconosciuto";
    throw new Error(msg);
  }

  return json.data;
}

// -----------------------------------------------------
// EVENTI / AGENDA
// -----------------------------------------------------

/**
 * Lista eventi per una data specifica.
 * @param {string} date - Formato "YYYY-MM-DD"
 */
export async function fetchEvents(date) {
  ensureConfig();

  const params = new URLSearchParams();
  if (date) {
    params.append("date", date);
  }
  params.append("api_key", API_KEY);

  const url = `${BASE_URL}/mobile/events/?${params.toString()}`;
  console.log("fetchEvents URL:", url);

  const res = await fetch(url);
  return await handleJsonResponse(res, "Errore caricamento eventi");
}

/**
 * Recupera un singolo evento per ID.
 */
export async function fetchEventById(id) {
  ensureConfig();

  if (!id) {
    throw new Error("ID evento mancante in fetchEventById");
  }

  const url = `${BASE_URL}/mobile/events/${id}?api_key=${API_KEY}`;
  console.log("fetchEventById URL:", url);

  const res = await fetch(url);
  return await handleJsonResponse(res, "Errore caricamento evento");
}

/**
 * Crea un nuovo evento.
 * @param {object} eventData - Dati evento (subject, date, start_time, end_time, etc.)
 */
export async function createEvent(eventData) {
  ensureConfig();

  const url = `${BASE_URL}/mobile/events/?api_key=${API_KEY}`;
  console.log("createEvent URL:", url);
  console.log("createEvent payload:", eventData);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  return await handleJsonResponse(res, "Errore creazione evento");
}

/**
 * Aggiorna un evento esistente.
 * @param {number|string} id
 * @param {object} eventData
 */
export async function updateEvent(id, eventData) {
  ensureConfig();

  if (!id) {
    throw new Error("ID evento mancante in updateEvent");
  }

  const url = `${BASE_URL}/mobile/events/${id}?api_key=${API_KEY}`;
  console.log("updateEvent URL:", url);
  console.log("updateEvent payload:", eventData);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  return await handleJsonResponse(res, "Errore aggiornamento evento");
}

/**
 * Elimina un evento.
 */
export async function deleteEvent(id) {
  ensureConfig();

  if (!id) {
    throw new Error("ID evento mancante in deleteEvent");
  }

  const url = `${BASE_URL}/mobile/events/${id}?api_key=${API_KEY}`;
  console.log("deleteEvent URL:", url);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  return await handleJsonResponse(res, "Errore eliminazione evento");
}

// -----------------------------------------------------
// OWNERS (ASSEGNATO A)
// -----------------------------------------------------

/**
 * Lista owners (assegnatari) dal backend.
 * Ritorna array di oggetti: [{ id, name }, ...]
 */
export async function fetchOwners() {
  ensureConfig();

  const params = new URLSearchParams();
  params.append("owners", "1");
  params.append("api_key", API_KEY);

  const url = `${BASE_URL}/mobile/events/?${params.toString()}`;
  console.log("fetchOwners URL:", url);

  const res = await fetch(url);
  const data = await handleJsonResponse(res, "Errore caricamento owners");

  // Ci aspettiamo data = [{id, name}, ...]
  console.log("fetchOwners data:", data);
  return data;
}

// -----------------------------------------------------
// CONTATTI (PAZIENTI)
// -----------------------------------------------------

/**
 * Lista contatti.
 * @param {string} [searchTerm] - (opzionale) stringa di ricerca
 */
export async function fetchContacts(searchTerm) {
  ensureConfig();

  const params = new URLSearchParams();
  params.append("api_key", API_KEY);
  if (searchTerm && searchTerm.trim() !== "") {
    params.append("search", searchTerm.trim());
  }

  const url = `${BASE_URL}/mobile/contacts/?${params.toString()}`;
  console.log("fetchContacts URL:", url);

  const res = await fetch(url);
  return await handleJsonResponse(res, "Errore caricamento contatti");
}

/**
 * Singolo contatto per ID.
 */
export async function fetchContactById(id) {
  ensureConfig();

  if (!id) {
    throw new Error("ID contatto mancante in fetchContactById");
  }

  const url = `${BASE_URL}/mobile/contacts/${id}?api_key=${API_KEY}`;
  console.log("fetchContactById URL:", url);

  const res = await fetch(url);
  return await handleJsonResponse(res, "Errore caricamento contatto");
}

/**
 * Crea un nuovo contatto.
 * @param {object} contactData
 */
export async function createContact(contactData) {
  ensureConfig();

  const url = `${BASE_URL}/mobile/contacts/?api_key=${API_KEY}`;
  console.log("createContact URL:", url);
  console.log("createContact payload:", contactData);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });

  return await handleJsonResponse(res, "Errore creazione contatto");
}

/**
 * Aggiorna contatto esistente.
 * @param {number|string} id
 * @param {object} contactData
 */
export async function updateContact(id, contactData) {
  ensureConfig();

  if (!id) {
    throw new Error("ID contatto mancante in updateContact");
  }

  const url = `${BASE_URL}/mobile/contacts/${id}?api_key=${API_KEY}`;
  console.log("updateContact URL:", url);
  console.log("updateContact payload:", contactData);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });

  return await handleJsonResponse(res, "Errore aggiornamento contatto");
}

/**
 * Elimina contatto.
 */
export async function deleteContact(id) {
  ensureConfig();

  if (!id) {
    throw new Error("ID contatto mancante in deleteContact");
  }

  const url = `${BASE_URL}/mobile/contacts/${id}?api_key=${API_KEY}`;
  console.log("deleteContact URL:", url);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  return await handleJsonResponse(res, "Errore eliminazione contatto");
}
