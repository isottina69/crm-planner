import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Api } from '../api/client';

export default function HomeScreen({ route }) {
  const { crm } = route.params;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const date = new Date().toISOString().split('T')[0];

    Api.getEvents(crm, { date, view: 'day' })
      .then((res) => {
        if (res.success && res.data) {
          setEvents(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Carico gli appuntamenti di oggi…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appuntamenti di oggi</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>Nessun evento</Text>
      ) : (
        events.map((ev) => (
          <View key={ev.id} style={styles.card}>
            <Text style={styles.evTitle}>{ev.title}</Text>
            <Text style={styles.evInfo}>
              {ev.start} → {ev.end}
            </Text>
            {ev.contact?.name && (
              <Text style={styles.evInfo}>Con: {ev.contact.name}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  empty: { color: '#6B7280' },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8
  },
  evTitle: { fontSize: 16, fontWeight: '600' },
  evInfo: { fontSize: 12, color: '#666', marginTop: 4 }
});
