// src/screens/SelectContactScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchContacts } from "../api/mobileClient";

export default function SelectContactScreen({ route, navigation }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // callback passato da CreateEventScreen
  const onSelect = route?.params?.onSelect || null;

  const loadContacts = useCallback(
    async (term = "") => {
      try {
        setLoading(true);
        const data = await fetchContacts(term);
        setContacts(data || []);
      } catch (e) {
        console.log("Errore fetchContacts:", e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      // carica i contatti iniziali
      loadContacts("");
    }, [loadContacts])
  );

  const handleSearch = () => {
    loadContacts(search);
  };

  const handlePressContact = (item) => {
    // 👉 manda il contatto alla schermata precedente
    if (onSelect) {
      onSelect({
        id: item.id,
        name: `${item.firstname || ""} ${item.lastname || ""}`.trim(),
        phone: item.phone || item.mobile || "",
      });
    }
    // 👉 torna indietro, NON apre una nuova CreateEvent
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePressContact(item)}
    >
      <Text style={styles.itemName}>
        {item.firstname} {item.lastname}
      </Text>
      {!!(item.phone || item.mobile) && (
        <Text style={styles.itemInfo}>{item.phone || item.mobile}</Text>
      )}
      {!!item.email && <Text style={styles.itemInfo}>{item.email}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleziona contatto</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per nome..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Cerca</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : contacts.length === 0 ? (
        <Text style={styles.empty}>Nessun contatto trovato</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  itemInfo: { fontSize: 14, color: "#555" },
  empty: { textAlign: "center", marginTop: 20, color: "#777" },
});
