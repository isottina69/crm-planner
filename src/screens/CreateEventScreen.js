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
import {
  createEvent,
  listOwners,
  updateEvent,
  deleteEvent,
} from '../api/mobileClient';

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
  return dateObj.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * YYYY-MM-DD da Date (usa UTC ma per le nostre ore va benissimo)
 */
function toDateString(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Converte un Date (in locale) in orario "di DB" (UTC) HH:MM
 */
function toTimeString(dateObj) {
  const h = String(dateObj.getUTCHours()).padStart(2, '0');
  const m = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Converte coppia (date_start, time_start) dal server (UTC) in Date locale
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

  useEffect(() => {
    const contact = route?.params?.selectedContact;
    if (contact) {
      setSelectedContact(contact);
      const name =
        contact.fullname ||
        `${contact.firstname || ''} ${contact.lastname || ''}`.trim();
      if (name) {
        setSubject(name);
      }
    }
  }, [route?.params?.selectedContact]);

  // =========================
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

    if (editingEvent?.start) {
      const [datePart, timePart] = editingEvent.start.split(' ');
      const d = parseUtcToLocal(datePart, timePart || '00:00:00');
      if (d) return d;
    }

    return new Date(defaultDateString + 'T09:00:00');
  })();

  const [startDateTime, setStartDateTime] = useState(initialStartDateTime);

  // =========================
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

    return new Date(initialStartDateTime.getTime() + 30 * 60 * 1000);
  })();

  const [endDateTime, setEndDateTime] = useState(initialEndDateTime);

  // TIPO VISITA (eventstatus)
  const [tipoVisita, setTipoVisita] = useState(() => {
    const evStatus = editingEvent?.tipologia_visita || editingEvent?.eventstatus;
    if (evStatus && TIPI_VISITA.includes(evStatus)) return evStatus;
    return TIPI_VISITA[0];
  });

  // TIPO ATTIVITÀ (activitytype)
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

        const listRaw = await listOwners(); // [{id, name, type}, ...]
        if (!isMounted) return;

        // normalizzo gli id a stringa
        const list = (listRaw || []).map((o) => ({
          ...o,
          id: String(o.id),
          name: o.name || o.label || "Senza nome",
        }));

        setOwners(list);

        let selectedId = null;

        // Prova a leggere l'assegnatario dall'evento (assigned_user_id o owner_id)
        const rawAssigned =
          editingEvent?.assigned_user_id ?? editingEvent?.owner_id;

        if (rawAssigned != null) {
          if (typeof rawAssigned === "string" && rawAssigned.includes("x")) {
            // es: "19x7" → "7"
            const parts = rawAssigned.split("x");
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
            (o.name || "")
              .toString()
              .toUpperCase()
              .includes("TFM SAN SALVO")
          );
          selectedId = tfm ? tfm.id : list[0].id;
        }

        setAssignedUserId(selectedId || null);
      } catch (e) {
        console.warn("Errore loadOwners", e);
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
    if (selectedDate) {
      const updated = new Date(startDateTime);
      updated.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setStartDateTime(updated);

      const updatedEnd = new Date(endDateTime);
      updatedEnd.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setEndDateTime(updatedEnd);
    }
  };

  const onChangeStartTime = (event, selectedDate) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      const updated = new Date(startDateTime);
      updated.setHours(
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        0,
        0
      );
      setStartDateTime(updated);

      const updatedEnd = new Date(updated.getTime() + 30 * 60 * 1000);
      setEndDateTime(updatedEnd);
    }
  };

  const onChangeEndTime = (event, selectedDate) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      const updated = new Date(endDateTime);
      updated.setHours(
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        0,
        0
      );
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
  end_time: toTimeString(endDateTime),     // UTC
  activitytype: tipoAttivita,
  eventstatus: tipoVisita,
  assigned_user_id: assignedUserId,
  owner_id: assignedUserId,                // per sicurezza lato PHP

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

        const updated = await updateEvent({
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
        const created = await createEvent(basePayload);
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

    Alert.alert(
      'Conferma',
      'Vuoi davvero eliminare questo appuntamento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const res = await deleteEvent(activityId);
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
                e.message || 'Errore durante la cancellazione.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const selectedContactName =
    selectedContact &&
    (
      selectedContact.fullname ||
      `${selectedContact.firstname || ''} ${
        selectedContact.lastname || ''
      }`
    ).trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* OGGETTO */}
        <Text style={styles.label}>
          {mode === 'edit' ? 'Modifica appuntamento' : 'Nuovo appuntamento'}
        </Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Es. Visita di controllo"
        />

        {/* CONTATTO */}
        <Text style={[styles.subLabel, { marginTop: 12 }]}>Contatto</Text>
        <TouchableOpacity
          style={[styles.input, styles.inputButton, styles.contactButton]}
          onPress={() => navigation.navigate('SelectContact')}
        >
          <Text style={styles.contactText}>
            {selectedContactName || 'Seleziona contatto'}
          </Text>
          <Text style={styles.contactAction}>Cerca</Text>
        </TouchableOpacity>

        {/* DATA */}
        <Text style={[styles.subLabel, { marginTop: 16 }]}>Data</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.input, styles.inputButton]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>{formatDateForDisplay(startDateTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* ORARI */}
        <Text style={[styles.subLabel, { marginTop: 12 }]}>Orario</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.input, styles.inputButton, { flex: 1, marginRight: 8 }]}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text>{formatTimeForDisplay(startDateTime)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.input, styles.inputButton, { flex: 1, marginLeft: 8 }]}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text>{formatTimeForDisplay(endDateTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* ASSEGNATO A */}
        <Text style={[styles.subLabel, { marginTop: 16 }]}>Assegnato a</Text>
        <View style={styles.pickerWrapper}>
  {loadingOwners ? (
    <ActivityIndicator />
  ) : (
    <Picker
      selectedValue={assignedUserId || ""}
      onValueChange={(val) => setAssignedUserId(val)}
    >
      {owners.map((u) => (
        <Picker.Item
          label={u.name}
          value={u.id}
          key={`${u.type || "user"}-${u.id}`}
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

        {/* SALVA */}
<TouchableOpacity
  style={[styles.button, saving && { opacity: 0.6 }, { marginTop: 20 }]}
  onPress={onSave}
  disabled={saving}
>
  <Text style={styles.buttonText}>
    {saving
      ? 'Salvataggio...'
      : mode === 'edit'
      ? 'Salva modifiche'
      : 'Salva appuntamento'}
  </Text>
</TouchableOpacity>

{/* ELIMINA (sotto il Salva) */}
{mode === 'edit' && editingEvent && (
  <TouchableOpacity
    style={[styles.deleteButton, saving && { opacity: 0.6 }, { marginTop: 12 }]}
    onPress={onDelete}
    disabled={saving}
  >
    <Text style={styles.deleteButtonText}>Elimina appuntamento</Text>
  </TouchableOpacity>
)}

        {/* PICKER NATIVI */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeStartDate}
          />
        )}

        {showStartTimePicker && (
          <DateTimePicker
            value={startDateTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeStartTime}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={endDateTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeEndTime}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputButton: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerWrapper: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  contactButton: {
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
