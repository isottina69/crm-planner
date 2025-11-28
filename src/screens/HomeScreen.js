// src/screens/HomeScreen.js
import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchEvents } from '../api/mobileClient';

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converte coppia (date_start, time_start) dal server
 * (che trattiamo come UTC) in un Date locale.
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

function formatTime(dateObj) {
  if (!dateObj) return '';
  return dateObj.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeScreen({ route, navigation }) {
  const nav = useNavigation();

  // Header: pulsante "Contatti"
  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => nav.navigate('Contacts')}
          style={{ marginRight: 12 }}
        >
          <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Contatti</Text>
        </TouchableOpacity>
      ),
    });
  }, [nav]);

  const [selectedDate, setSelectedDate] = useState(todayString());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(
    async (dateToLoad) => {
      const date = dateToLoad || selectedDate;

      try {
        setLoading(true);
        const data = await fetchEvents(date, 'day'); // vista giornaliera
        setEvents(data || []);
      } catch (e) {
        console.error('Errore fetchEvents:', e);
        Alert.alert('Errore', e.message || 'Errore durante il caricamento degli appuntamenti.');
      } finally {
        setLoading(false);
      }
    },
    [selectedDate]
  );

  useFocusEffect(
    useCallback(() => {
      loadEvents(selectedDate);
    }, [loadEvents, selectedDate])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadEvents(selectedDate);
    } finally {
      setRefreshing(false);
    }
  }, [loadEvents, selectedDate]);

  const onDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    loadEvents(dateString);
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#4f46e5',
      selectedTextColor: '#ffffff',
    },
  };

  const goToCreateEvent = () => {
    navigation.navigate('CreateEvent', {
      mode: 'create',
      date: selectedDate,
    });
  };

  const onPressEvent = (event) => {
    navigation.navigate('CreateEvent', {
      mode: 'edit',
      event,
    });
  };

  const renderEventItem = (ev) => {
    const startLocal = parseUtcToLocal(ev.date_start, ev.time_start);
    const endLocal = parseUtcToLocal(ev.due_date, ev.time_end);

    const timeLabel = `${formatTime(startLocal)} - ${formatTime(endLocal)}`;
    const tipoVisita =
      ev.tipologia_visita || ev.eventstatus || '';

    const contactName = ev?.contact?.name || '';
    const contactPhone = ev?.contact?.phone || '';

    return (
      <TouchableOpacity
        key={String(ev.activityid || ev.id)}
        style={styles.eventCard}
        onPress={() => onPressEvent(ev)}
      >
        <View style={styles.eventHeaderRow}>
          <Text style={styles.eventTitle}>{ev.subject || ev.title}</Text>
          {tipoVisita ? (
            <Text style={styles.eventBadge}>{tipoVisita}</Text>
          ) : null}
        </View>

        <Text style={styles.eventTime}>{timeLabel}</Text>

        {contactName ? (
          <Text style={styles.eventContact}>
            {contactName}
            {contactPhone ? ` · ${contactPhone}` : ''}
          </Text>
        ) : null}

        {ev.location ? (
          <Text style={styles.eventLocation}>{ev.location}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Calendario */}
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#4f46e5',
          todayTextColor: '#4f46e5',
          arrowColor: '#4f46e5',
        }}
      />

      {/* Lista appuntamenti */}
      <ScrollView
        style={styles.eventsContainer}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>
          Appuntamenti del {selectedDate.split('-').reverse().join('/')}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>Nessun appuntamento per questa data.</Text>
        ) : (
          events.map(renderEventItem)
        )}
      </ScrollView>

      {/* FAB nuovo appuntamento */}
      <TouchableOpacity style={styles.fab} onPress={goToCreateEvent}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  eventsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  eventBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  eventTime: {
    fontSize: 14,
    color: '#4B5563',
  },
  eventContact: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  eventLocation: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
  },
});
