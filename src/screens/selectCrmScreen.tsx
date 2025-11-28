import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { CRMS } from '../config/crms';

export default function SelectCrmScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Home', { crm: item })}
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.url}>{item.baseUrl}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Seleziona CRM</Text>
      <FlatList
        data={CRMS}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  header: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16
  },
  title: { fontSize: 16, fontWeight: '600' },
  url: { fontSize: 12, color: '#6B7280', marginTop: 4 }
});
