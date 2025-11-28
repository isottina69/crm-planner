// src/screens/CreateContactScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { createContact } from "../api/mobileClient";

export default function CreateContactScreen({ navigation }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!lastname.trim()) {
      Alert.alert("Dati mancanti", "Il cognome è obbligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        mobile: mobile.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim(),
      };

      const result = await createContact(payload);

      if (!result || result.success === false) {
        const msg =
          result?.error?.message || "Non è stato possibile creare il contatto.";
        Alert.alert("Errore", msg);
      } else {
        Alert.alert("Contatto creato", "Il nuovo contatto è stato salvato.", [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (e) {
      console.log("Errore createContact:", e);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante il salvataggio del contatto."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuovo contatto</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Mario"
            value={firstname}
            onChangeText={setFirstname}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Cognome <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Rossi"
            value={lastname}
            onChangeText={setLastname}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Cellulare</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. 3331234567"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Telefono</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. 0873..."
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. mario.rossi@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Note sul contatto..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.saveButtonText}>Salva contatto</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  required: {
    color: "red",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
