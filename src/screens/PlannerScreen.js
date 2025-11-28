import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const mockEvents = [
  {
    id: '1',
    title: 'Visita di controllo',
    start: '09:30',
    end: '10:00',
    contact: { name: 'Mario Rossi' },
    location: 'Studio Vasto'
  },
  {
    id: '2',
    title: 'Prima visita',
    start: '10:30',
    end: '11:15',
    contact: { name: 'Anna Bianchi' },
    location: 'Studio San Salvo'
  },
  {
    id: '3',
    title: 'Controllo dieta',
    start: '17:00',
    end: '17:30',
    contact: { name: 'Luca Verdi' },
    location: 'Online'
  }
];

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8:00–19:00

export default function PlannerScreen({ route }) {
  const { crm } = route.params;

  // per ogni ora, prendo gli eventi che iniziano in quell'ora
  const eventsByHour = useMemo(() => {
    const map = {};
    HOURS.forEach((h) => (map[h] = []));
    mockEvents.forEach((ev) => {
      const [hh, mm] = ev.start.split(':');
      const hour = parseInt(hh, 10);
      if (!map[hour]) map[hour] = [];
      map[hour].push(ev);
    });
    return map;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planner giornaliero – {crm.name}</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {HOURS.map((hour) => {
          const label = `${hour.toString().padStart(2, '0')}:00`;
          const slotEvents = eventsByHour[hour] || [];

          return (
            <View key={hour} style={styles.row}>
              {/* Colonna orario */}
              <View style={styles.hourColumn}>
                <Text style={styles.hourLabel}>{label}</Text>
              </View>

              {/* Colonna slot */}
              <View style={styles.slotColumn}>
                {slotEvents.length === 0 ? (
                  <View style={styles.freeSlot}>
                    <Text style={styles.freeText}>Libero</Text>
                  </View>
                ) : (
                  slotEvents.map((ev) => (
                    <View key={ev.id} style={styles.eventCard}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <Text style={styles.eventInfo}>
                        {ev.start}–{ev.end}
                      </Text>
                      {ev.contact && ev.contact.name && (
                        <Text style={styles.eventInfo}>Con: {ev.contact.name}</Text>
                      )}
                      {ev.location && (
                        <Text style={styles.eventInfo}>📍 {ev.location}</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  scroll: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 60
  },
  hourColumn: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 8
  },
  hourLabel: { fontSize: 12, color: '#6B7280' },
  slotColumn: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 8
  },
  freeSlot: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB'
  },
  freeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  eventCard: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#DBEAFE',
    marginBottom: 4
  },
  eventTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventInfo: { fontSize: 11, color: '#1F2933', marginTop: 1 }
});
