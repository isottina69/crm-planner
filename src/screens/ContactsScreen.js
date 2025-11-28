// src/screens/ContactsScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchContacts } from "../api/mobileClient";

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Errore fetchContacts:", e);
      Alert.alert("Errore", "Impossibile caricare i contatti.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  const renderItem = (c) => {
    const fullName = [c.firstname, c.lastname].filter(Boolean).join(" ");
    return (
      <View key={c.id || fullName} style={styles.card}>
        <Text style={styles.cardTitle}>{fullName || "(Senza nome)"}</Text>
        {c.mobile ? (
          <Text style={styles.cardLine}>📱 {c.mobile}</Text>
        ) : null}
        {c.phone ? <Text style={styles.cardLine}>☎️ {c.phone}</Text> : null}
        {c.email ? <Text style={styles.cardLine}>✉️ {c.email}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contatti</Text>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Caricamento contatti...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {contacts.length === 0 ? (
            <View style={styles.center}>
              <Text>Nessun contatto trovato.</Text>
              <Text style={{ marginTop: 4 }}>
                Premi il “+” per aggiungere un contatto.
              </Text>
            </View>
          ) : (
            contacts.map(renderItem)
          )}
        </ScrollView>
      )}

      {/* FAB + */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateContact")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardLine: {
    fontSize: 14,
    color: "#444",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "600",
  },
});
