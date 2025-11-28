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

export default function SelectContactScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadContacts = async (searchText = "") => {
    try {
      setLoading(true);
      const data = await fetchContacts(searchText);
      setContacts(data || []);
    } catch (err) {
      console.log("Errore fetchContacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const onChangeSearch = (text) => {
    setSearch(text);
    loadContacts(text);
  };

  const onSelectContact = (contact) => {
    // Torna alla schermata di creazione evento passando il contatto selezionato
    navigation.navigate("CreateEvent", { selectedContact: contact });
  };

  const renderItem = ({ item }) => {
    const name = item.fullname || `${item.firstname || ""} ${item.lastname || ""}`.trim();
    return (
      <TouchableOpacity style={styles.item} onPress={() => onSelectContact(item)}>
        <Text style={styles.itemName}>{name || "Senza nome"}</Text>
        {item.mobile ? <Text style={styles.itemInfo}>{item.mobile}</Text> : null}
        {item.email ? <Text style={styles.itemInfo}>{item.email}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleziona contatto</Text>

      <TextInput
        style={styles.search}
        placeholder="Cerca contatto..."
        value={search}
        onChangeText={onChangeSearch}
      />

      {loading ? <ActivityIndicator style={{ marginTop: 10 }} /> : null}

      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Nessun contatto trovato</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7", padding: 10 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
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
