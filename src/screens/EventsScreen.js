// src/screens/EventsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { fetchEvents } from '../api/mobileClient';

function formatDateLabel(dateObj) {
  return dateObj.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatTimeLabel(dateTimeString) {
  if (!dateTimeString) return '';
  const d = new Date(dateTimeString.replace(' ', 'T')); // "YYYY-MM-DD HH:MM"
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function EventsScreen({ navigation }) {
  const [viewType, setViewType] = useState('day'); // 'day' | 'week'
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(
    async (date, view, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const data = await fetchEvents(date, view);
        setEvents(data);
      } catch (e) {
        console.error('Errore fetchEvents:', e);
        setError(e.message || 'Errore nel caricamento eventi');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadEvents(currentDate, viewType, false);
  }, [currentDate, viewType, loadEvents]);

  const onRefresh = () => {
    loadEvents(currentDate, viewType, true);
  };

  const changeDay = (delta) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().slice(0, 10);
    setCurrentDate(newDate);
  };

  const renderEventItem = ({ item }) => {
    const startLabel = formatTimeLabel(item.start);
    const endLabel = formatTimeLabel(item.end);

    return (
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Appuntamento'}
        </Text>

        <Text style={styles.rowText}>
          ⏰ {startLabel} {endLabel ? `- ${endLabel}` : ''}
        </Text>

        {item.location ? (
          <Text style={styles.rowText}>📍 {item.location}</Text>
        ) : null}

        {item.contact?.name || item.contact?.phone ? (
          <Text style={styles.rowText}>
            👤 {item.contact?.name || 'Contatto'}{' '}
            {item.contact?.phone ? `(${item.contact.phone})` : ''}
          </Text>
        ) : null}
      </View>
    );
  };

  const dateObj = new Date(currentDate);

  return (
    <View style={styles.container}>
      {/* Barra superiore: selezione giorno / settimana e cambio data */}
      <View style={styles.topBar}>
        <View style={styles.viewSwitch}>
          <TouchableOpacity
            style={[styles.viewButton, viewType === 'day' && styles.viewButtonActive]}
            onPress={() => setViewType('day')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewType === 'day' && styles.viewButtonTextActive,
              ]}
            >
              Giorno
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewType === 'week' && styles.viewButtonActive]}
            onPress={() => setViewType('week')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewType === 'week' && styles.viewButtonTextActive,
              ]}
            >
              Settimana
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>◀</Text>
          </TouchableOpacity>

          <View style={styles.dateLabelContainer}>
            <Text style={styles.dateLabel}>{formatDateLabel(dateObj)}</Text>
          </View>

          <TouchableOpacity onPress={() => changeDay(1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stato di caricamento / errore */}
      {loading && !refreshing && (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.infoText}>Caricamento appuntamenti...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista eventi */}
      {!loading && !error && (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={
            events.length === 0 ? styles.emptyContainer : styles.listContainer
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.infoText}>Nessun appuntamento per questa data.</Text>
            </View>
          }
        />
      )}

      {/* Pulsante flottante "+" per creare un nuovo appuntamento */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent', { date: currentDate })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  viewSwitch: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: '#fff',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  navBtnText: {
    fontSize: 18,
    color: '#4f46e5',
  },
  dateLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  infoText: {
    marginTop: 8,
    color: '#6b7280',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  rowText: {
    fontSize: 13,
    color: '#4b5563',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
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
