import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const FIELDS = [
  { field: 'username', placeholder: 'Username', auto: 'none' },
  { field: 'email', placeholder: 'Email', auto: 'none', keyboard: 'email-address' },
  { field: 'password', placeholder: 'Password', secure: true },
  { field: 'confirm', placeholder: 'Confirm Password', secure: true },
];

export const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const setField = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.username.trim(), form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start tracking stocks in real time</Text>

        {FIELDS.map(({
          field, placeholder, auto, keyboard, secure,
        }) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.muted}
            value={form[field]}
            onChangeText={setField(field)}
            autoCapitalize={auto || 'words'}
            keyboardType={keyboard || 'default'}
            secureTextEntry={!!secure}
          />
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            Already have an account?
            {' '}
            <Text style={styles.linkAccent}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { color: COLORS.muted, marginBottom: 32, fontSize: 15 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: COLORS.up,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  btnText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
  link: { color: COLORS.muted, textAlign: 'center' },
  linkAccent: { color: COLORS.up, fontWeight: '600' },
});
