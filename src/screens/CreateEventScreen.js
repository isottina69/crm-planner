// src/screens/CreateEventScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as api from '../api/mobileClient';

const TIPI_VISITA = [
  'Visita di controllo',
  'Prima visita',
  'Follow up',
  'DEXA',
  'Piano alimentare',
];

const TIPI_ATTIVITA = ['TFM', 'Studio', 'Online'];

/**
 * Mostra la data in formato italiano
 */
function formatDateForDisplay(dateObj) {
  return dateObj.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Mostra l’orario in formato HH:MM
 */
function formatTimeForDisplay(dateObj) {
  const hh = dateObj.getHours().toString().padStart(2, '0');
  const mm = dateObj.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Ritorna stringa data in formato "YYYY-MM-DD" (UTC)
 */
function toDateString(dateObj) {
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ritorna orario in formato "HH:MM" (UTC)
 */
function toTimeString(dateObj) {
  const hh = String(dateObj.getUTCHours()).padStart(2, '0');
  const mm = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Converte data + orario del CRM (in UTC) a oggetto Date locale
 *
 * @param {string} dateStr  - es: "2025-11-28"
 * @param {string} timeStr  - es: "09:30:00"
 */
function parseUtcToLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n || '0', 10));
  const tParts = timeStr.split(':').map((n) => parseInt(n || '0', 10));
  const hh = tParts[0] || 0;
  const mm = tParts[1] || 0;
  const ss = tParts[2] || 0;

  if (!y || !m || !d) return null;

  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
}

export default function CreateEventScreen({ route, navigation }) {
  const mode = route?.params?.mode || 'create';
  const editingEvent = route?.params?.event || null;

  const defaultDateString =
    route?.params?.date || new Date().toISOString().slice(0, 10);

  const [subject, setSubject] = useState(
    editingEvent?.subject || editingEvent?.title || ''
  );

  // 👉 contatto selezionato (da SelectContactScreen)
  const [selectedContact, setSelectedContact] = useState(
    route?.params?.selectedContact || null
  );

  // Se siamo in edit e non c'è selectedContact nei param,
  // proviamo a leggerlo dai campi dell'evento se disponibili
  useEffect(() => {
    if (mode === 'edit' && editingEvent && !selectedContact) {
      if (editingEvent.contact) {
        setSelectedContact({
          id: editingEvent.contact.id,
          name: editingEvent.contact.name,
          phone: editingEvent.contact.phone,
        });
      } else if (editingEvent.contact_id || editingEvent.contactname) {
        setSelectedContact({
          id: editingEvent.contact_id || null,
          name: editingEvent.contactname || '',
          phone: editingEvent.contactphone || '',
        });
      }
    }
  }, [mode, editingEvent, selectedContact]);

  // DATA/ORA INIZIO (UTC → locale)
  // =========================
  const initialStartDateTime = (() => {
    if (editingEvent?.date_start && editingEvent?.time_start) {
      const d = parseUtcToLocal(
        editingEvent.date_start,
        editingEvent.time_start
      );
      if (d) return d;
    }

    // fallback: se viene passato date_start senza orario
    if (editingEvent?.start) {
      const [datePart, timePart] = editingEvent.start.split(' ');
      const d = parseUtcToLocal(datePart, timePart || '00:00:00');
      if (d) return d;
    }

    // nuovo evento:
    // - data = quella selezionata sul calendario
    // - ora = ora corrente arrotondata al quarto d'ora successivo
    const now = new Date();
    const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);

    const [y, m, d] = defaultDateString.split('-').map((n) => parseInt(n, 10));
    const local = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), 0);

    // convertiamo in UTC per coerenza con toDateString/toTimeString
    const utc = new Date(
      Date.UTC(
        local.getFullYear(),
        local.getMonth(),
        local.getDate(),
        local.getHours(),
        local.getMinutes(),
        0
      )
    );

    return utc;
  })();

  // DATA/ORA FINE (UTC → locale)
  // =========================
  const initialEndDateTime = (() => {
    if (editingEvent?.due_date && editingEvent?.time_end) {
      const d = parseUtcToLocal(
        editingEvent.due_date,
        editingEvent.time_end
      );
      if (d) return d;
    }

    if (editingEvent?.end) {
      const [datePart, timePart] = editingEvent.end.split(' ');
      const d = parseUtcToLocal(datePart, timePart || '00:00:00');
      if (d) return d;
    }

    // se nuovo evento, default = orario inizio + 30 minuti
    const start = initialStartDateTime;
    const end = new Date(start.getTime() + 30 * 60000);
    return end;
  })();

  const [startDateTime, setStartDateTime] = useState(initialStartDateTime);
  const [endDateTime, setEndDateTime] = useState(initialEndDateTime);

  // tipo visita
  const [tipoVisita, setTipoVisita] = useState(() => {
    const evStatus = editingEvent?.eventstatus;
    if (evStatus && TIPI_VISITA.includes(evStatus)) return evStatus;
    return TIPI_VISITA[0];
  });

  // tipo attività
  const [tipoAttivita, setTipoAttivita] = useState(() => {
    const actType = editingEvent?.activitytype;
    if (actType && TIPI_ATTIVITA.includes(actType)) return actType;
    return TIPI_ATTIVITA[0];
  });

  // Assegnato a
  const [owners, setOwners] = useState([]);
  const [assignedUserId, setAssignedUserId] = useState(null);
  const [loadingOwners, setLoadingOwners] = useState(true);

  const [saving, setSaving] = useState(false);

  // carica lista "Assegnato a"
  useEffect(() => {
    let isMounted = true;

    async function loadOwners() {
      try {
        setLoadingOwners(true);

        const listRaw = api.listOwners
          ? await api.listOwners() // [{id, name, type}, ...]
          : api.fetchOwners
          ? await api.fetchOwners()
          : [];
        if (!isMounted) return;

        // normalizzo gli id a stringa
        const list = (listRaw || []).map((o) => ({
          ...o,
          id: String(o.id),
          name: o.name || o.label || 'Senza nome',
        }));

        setOwners(list);

        let selectedId = null;

        // Prova a leggere l'assegnatario dall'evento (assigned_user_id o owner_id)
        const rawAssigned =
          editingEvent?.assigned_user_id ?? editingEvent?.owner_id;

        if (rawAssigned != null) {
          if (typeof rawAssigned === 'string' && rawAssigned.includes('x')) {
            // es: "19x7" → "7"
            const parts = rawAssigned.split('x');
            selectedId = parts[1] || null;
          } else {
            selectedId = String(rawAssigned);
          }

          if (!list.find((o) => o.id === selectedId)) {
            selectedId = null;
          }
        }

        // default: "TFM SAN SALVO" oppure primo owner
        if (!selectedId && list.length > 0) {
          const tfm = list.find((o) =>
            (o.name || '')
              .toString()
              .toUpperCase()
              .includes('TFM SAN SALVO')
          );
          selectedId = tfm ? tfm.id : list[0].id;
        }

        setAssignedUserId(selectedId || null);
      } catch (e) {
        console.warn('Errore loadOwners', e);
      } finally {
        if (isMounted) {
          setLoadingOwners(false);
        }
      }
    }

    loadOwners();

    return () => {
      isMounted = false;
    };
  }, [editingEvent]);

  // visibilità picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const updated = new Date(startDateTime);
      updated.setUTCFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setStartDateTime(updated);

      // se la fine è prima dell'inizio, sposto anche la fine
      if (endDateTime < updated) {
        const endUpdated = new Date(updated.getTime() + 30 * 60000);
        setEndDateTime(endUpdated);
      }
    }
  };

  const onChangeStartTime = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const updated = new Date(startDateTime);
      updated.setUTCHours(selectedTime.getHours(), selectedTime.getMinutes(), 0);
      setStartDateTime(updated);

      // se la fine è prima dell'inizio, sposto anche la fine
      if (endDateTime < updated) {
        const endUpdated = new Date(updated.getTime() + 30 * 60000);
        setEndDateTime(endUpdated);
      }
    }
  };

  const onChangeEndTime = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const updated = new Date(endDateTime);
      updated.setUTCHours(selectedTime.getHours(), selectedTime.getMinutes(), 0);
      setEndDateTime(updated);
    }
  };

  const onSave = async () => {
    if (!subject) {
      Alert.alert('Attenzione', 'Compila il campo Oggetto.');
      return;
    }

    if (!assignedUserId) {
      Alert.alert(
        'Attenzione',
        'Nessun utente selezionato in "Assegnato a".'
      );
      return;
    }

    const basePayload = {
      subject,
      date: toDateString(startDateTime),
      start_time: toTimeString(startDateTime), // UTC
      end_time: toTimeString(endDateTime), // UTC
      activitytype: tipoAttivita,
      eventstatus: tipoVisita,
      assigned_user_id: assignedUserId,
      owner_id: assignedUserId, // per sicurezza lato PHP

      // 👉 nuovo campo: ID del contatto scelto nell'app
      contact_id: selectedContact?.id || null,
    };

    try {
      setSaving(true);

      if (mode === 'edit' && editingEvent) {
        const activityId =
          editingEvent.activityid ||
          editingEvent.id ||
          editingEvent.activityId;

        if (!activityId) {
          throw new Error('ID evento mancante per la modifica.');
        }

        const updated = await api.updateEvent({
          ...basePayload,
          activityid: activityId,
        });
        console.log('Evento aggiornato:', updated);

        Alert.alert('Ok', 'Appuntamento aggiornato con successo.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const created = await api.createEvent(basePayload);
        console.log('Creato evento:', created);

        Alert.alert('Ok', 'Appuntamento creato con successo.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (e) {
      console.error('Errore salvataggio evento:', e);
      Alert.alert('Errore', e.message || 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!(mode === 'edit' && editingEvent)) return;

    const activityId =
      editingEvent.activityid || editingEvent.id || editingEvent.activityId;

    if (!activityId) {
      Alert.alert('Errore', 'ID evento mancante per la cancellazione.');
      return;
    }

    Alert.alert('Conferma', 'Vuoi davvero eliminare questo appuntamento?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const res = await api.deleteEvent(activityId);
            console.log('Evento eliminato:', res);

            Alert.alert('Ok', 'Appuntamento eliminato.', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (e) {
            console.error('Errore cancellazione evento:', e);
            Alert.alert(
              'Errore',
              e.message || 'Errore durante l\'eliminazione.'
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const openSelectContact = () => {
    navigation.navigate('SelectContact', {
      onSelect: (contact) => {
        setSelectedContact(contact || null);
      },
    });
  };

  const currentDateLabel = formatDateForDisplay(
    new Date(
      startDateTime.getUTCFullYear(),
      startDateTime.getUTCMonth(),
      startDateTime.getUTCDate()
    )
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {mode === 'edit' ? 'Modifica appuntamento' : 'Nuovo appuntamento'}
          </Text>
          <Text style={styles.dateLabel}>{currentDateLabel}</Text>
        </View>

        {/* OGGETTO */}
        <Text style={styles.label}>Oggetto</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome del paziente"
          value={subject}
          onChangeText={setSubject}
        />

        {/* CONTATTO COLLEGATO */}
        <View style={styles.contactRow}>
          <View>
            <Text style={styles.subLabel}>Contatto collegato</Text>
            {selectedContact ? (
              <Text style={styles.contactText}>
                {selectedContact.name}
                {selectedContact.phone ? ` (${selectedContact.phone})` : ''}
              </Text>
            ) : (
              <Text style={[styles.contactText, { color: '#6b7280' }]}>
                Nessun contatto selezionato
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={openSelectContact}>
            <Text style={styles.contactAction}>
              {selectedContact ? 'Cambia' : 'Seleziona'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DATA INIZIO */}
        <Text style={[styles.subLabel, { marginTop: 16 }]}>Data</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text>{formatDateForDisplay(
            new Date(
              startDateTime.getUTCFullYear(),
              startDateTime.getUTCMonth(),
              startDateTime.getUTCDate()
            )
          )}</Text>
        </TouchableOpacity>

        {/* ORA INIZIO / FINE */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Ora inizio</Text>
            <TouchableOpacity
              style={[styles.input, styles.inputButton]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text>{formatTimeForDisplay(startDateTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: 12 }} />

          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Ora fine</Text>
            <TouchableOpacity
              style={[styles.input, styles.inputButton, { flex: 1, marginLeft: 8 }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text>{formatTimeForDisplay(endDateTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ASSEGNATO A */}
        <Text style={[styles.subLabel, { marginTop: 16 }]}>Assegnato a</Text>
        <View style={styles.pickerWrapper}>
          {loadingOwners ? (
            <ActivityIndicator />
          ) : (
            <Picker
              selectedValue={assignedUserId || ''}
              onValueChange={(val) => setAssignedUserId(val)}
            >
              {owners.map((u) => (
                <Picker.Item
                  label={u.name}
                  value={u.id}
                  key={`${u.type || 'user'}-${u.id}`}
                />
              ))}
            </Picker>
          )}
        </View>

        {/* TIPO VISITA */}
        <Text style={[styles.subLabel, { marginTop: 12 }]}>Tipo visita</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={tipoVisita}
            onValueChange={(val) => setTipoVisita(val)}
          >
            {TIPI_VISITA.map((s) => (
              <Picker.Item label={s} value={s} key={s} />
            ))}
          </Picker>
        </View>

        {/* TIPO ATTIVITÀ */}
        <Text style={[styles.subLabel, { marginTop: 12 }]}>Tipo attività</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={tipoAttivita}
            onValueChange={(val) => setTipoAttivita(val)}
          >
            {TIPI_ATTIVITA.map((s) => (
              <Picker.Item label={s} value={s} key={s} />
            ))}
          </Picker>
        </View>

        {/* PULSANTI */}
        <View style={styles.buttonsRow}>
          {mode === 'edit' && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onDelete}
              disabled={saving}
            >
              <Text style={styles.buttonText}>Elimina</Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving
                ? 'Salvataggio...'
                : mode === 'edit'
                ? 'Salva modifiche'
                : 'Crea appuntamento'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PICKER NATIVE (IOS/ANDROID) */}
        {showStartDatePicker && (
          <DateTimePicker
            value={new Date(
              startDateTime.getUTCFullYear(),
              startDateTime.getUTCMonth(),
              startDateTime.getUTCDate()
            )}
            mode="date"
            display="default"
            onChange={onChangeStartDate}
          />
        )}

        {showStartTimePicker && (
          <DateTimePicker
            value={new Date(
              1970,
              0,
              1,
              startDateTime.getUTCHours(),
              startDateTime.getUTCMinutes(),
              0
            )}
            mode="time"
            is24Hour
            display="default"
            onChange={onChangeStartTime}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={new Date(
              1970,
              0,
              1,
              endDateTime.getUTCHours(),
              endDateTime.getUTCMinutes(),
              0
            )}
            mode="time"
            is24Hour
            display="default"
            onChange={onChangeEndTime}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  dateLabel: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  inputButton: {
    justifyContent: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#111827',
  },
  contactAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
});
