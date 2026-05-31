import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (form.password !== form.confirm) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (form.password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
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

        {[
          { field: 'username', placeholder: 'Username', auto: 'none' },
          { field: 'email', placeholder: 'Email', auto: 'none', keyboard: 'email-address' },
          { field: 'password', placeholder: 'Password', secure: true },
          { field: 'confirm', placeholder: 'Confirm Password', secure: true },
        ].map(({ field, placeholder, auto, keyboard, secure }) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#8B949E"
            value={form[field]}
            onChangeText={set(field)}
            autoCapitalize={auto || 'words'}
            keyboardType={keyboard || 'default'}
            secureTextEntry={!!secure}
          />
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0D1117" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkAccent}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { color: '#8B949E', marginBottom: 32, fontSize: 15 },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: '#00D09C',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  btnText: { color: '#0D1117', fontWeight: '700', fontSize: 16 },
  link: { color: '#8B949E', textAlign: 'center' },
  linkAccent: { color: '#00D09C', fontWeight: '600' },
});
