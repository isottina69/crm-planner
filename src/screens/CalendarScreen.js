import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const mockEventsByDate = {
  '2025-11-24': [
    { id: '1', title: 'Visita di controllo', time: '09:30', contact: 'Mario Rossi' },
    { id: '2', title: 'Prima visita', time: '10:30', contact: 'Anna Bianchi' }
  ],
  '2025-11-25': [
    { id: '3', title: 'Controllo dieta', time: '17:00', contact: 'Luca Verdi' }
  ]
};

const mockDays = [
  { date: '2025-11-24', label: 'Oggi' },
  { date: '2025-11-25', label: 'Domani' },
  { date: '2025-11-26', label: 'Mercoledì' }
];

export default function CalendarScreen({ route, navigation }) {
  const { crm } = route.params;
  const [selectedDate, setSelectedDate] = useState(mockDays[0].date);

  const events = mockEventsByDate[selectedDate] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Calendario – {crm.name}
      </Text>

      {/* Barra giorni */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {mockDays.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.dayChip, isSelected && styles.dayChipSelected]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {day.label}
              </Text>
              <Text style={[styles.dayDate, isSelected && styles.dayLabelSelected]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista eventi del giorno */}
      {events.length === 0 ? (
        <Text style={styles.empty}>Nessun evento per questa data</Text>
      ) : (
        <ScrollView>
          {events.map((ev) => (
            <View key={ev.id} style={styles.card}>
              <Text style={styles.time}>{ev.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.evTitle}>{ev.title}</Text>
                <Text style={styles.evInfo}>Con: {ev.contact}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  daysRow: { gap: 8, paddingBottom: 12 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999
  },
  dayChipSelected: {
    backgroundColor: '#2563EB'
  },
  dayLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  dayLabelSelected: { color: '#FFFFFF' },
  dayDate: { fontSize: 10, color: '#6B7280' },
  empty: { color: '#6B7280', marginTop: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10
  },
  time: { fontSize: 14, fontWeight: '600', marginRight: 12, marginTop: 4 },
  evTitle: { fontSize: 16, fontWeight: '600' },
  evInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 }
});
