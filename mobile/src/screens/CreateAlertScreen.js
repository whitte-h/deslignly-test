import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertsAPI, stocksAPI } from '../api';
import { DEFAULT_SYMBOLS } from '../constants';

export default function CreateAlertScreen({ route, navigation }) {
  const preselected = route.params?.symbol ?? '';
  const [symbol, setSymbol] = useState(preselected);
  const [targetPrice, setTargetPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(!preselected);

  useEffect(() => {
    if (symbol) fetchQuote(symbol);
  }, [symbol]);

  const fetchQuote = async (sym) => {
    try {
      const { data } = await stocksAPI.quote(sym);
      setCurrentPrice(data.c);
    } catch {
      setCurrentPrice(null);
    }
  };

  const searchSymbols = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await stocksAPI.search(q);
      setSearchResults((data.result ?? []).slice(0, 10));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSymbol = (sym) => {
    setSymbol(sym);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!symbol) return Alert.alert('Error', 'Please select a stock symbol');
    const price = parseFloat(targetPrice);
    if (!targetPrice || isNaN(price) || price <= 0) {
      return Alert.alert('Error', 'Please enter a valid target price');
    }
    setLoading(true);
    try {
      await alertsAPI.create({ symbol, targetPrice: price });
      Alert.alert('Success', `Alert created for ${symbol} at $${price.toFixed(2)}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Stock Symbol</Text>

        {!showSearch && symbol ? (
          <TouchableOpacity style={styles.selectedSymbol} onPress={() => setShowSearch(true)}>
            <View>
              <Text style={styles.selectedText}>{symbol}</Text>
              {currentPrice !== null && (
                <Text style={styles.currentPrice}>Current: ${currentPrice.toFixed(2)}</Text>
              )}
            </View>
            <Ionicons name="swap-horizontal-outline" size={20} color="#8B949E" />
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search (e.g. AAPL, Tesla)"
                placeholderTextColor="#8B949E"
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); searchSymbols(t); }}
                autoCapitalize="characters"
              />
              {searching && <ActivityIndicator color="#00D09C" style={{ marginLeft: 8 }} />}
            </View>

            {/* Popular symbols */}
            {!searchQuery && (
              <>
                <Text style={styles.sublabel}>Popular</Text>
                <View style={styles.chipRow}>
                  {DEFAULT_SYMBOLS.map((s) => (
                    <TouchableOpacity key={s} style={styles.chip} onPress={() => selectSymbol(s)}>
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <View style={styles.results}>
                {searchResults.map((r) => (
                  <TouchableOpacity key={r.symbol} style={styles.resultItem} onPress={() => selectSymbol(r.symbol)}>
                    <Text style={styles.resultSymbol}>{r.symbol}</Text>
                    <Text style={styles.resultDesc} numberOfLines={1}>{r.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>Target Price (USD)</Text>
        <View style={styles.priceRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="0.00"
            placeholderTextColor="#8B949E"
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
        {currentPrice !== null && (
          <TouchableOpacity onPress={() => setTargetPrice((currentPrice * 1.05).toFixed(2))}>
            <Text style={styles.hint}>
              <Ionicons name="flash-outline" size={13} color="#00D09C" /> Tap to set 5% above current (${(currentPrice * 1.05).toFixed(2)})
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.info}>
          <Ionicons name="information-circle-outline" size={14} color="#8B949E" />
          {' '}You'll receive a push notification when the price reaches your target.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0D1117" />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={20} color="#0D1117" />
              <Text style={styles.btnText}>Create Alert</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  inner: { padding: 20 },
  label: { color: '#8B949E', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  sublabel: { color: '#8B949E', fontSize: 12, marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D',
    borderRadius: 10, padding: 14, color: '#FFFFFF', fontSize: 16,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  selectedSymbol: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#161B22', borderWidth: 1, borderColor: '#00D09C',
    borderRadius: 10, padding: 14,
  },
  selectedText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  currentPrice: { color: '#8B949E', fontSize: 13, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  results: { backgroundColor: '#161B22', borderRadius: 10, borderWidth: 1, borderColor: '#30363D', marginTop: 8, overflow: 'hidden' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  resultSymbol: { color: '#FFFFFF', fontWeight: '700' },
  resultDesc: { color: '#8B949E', fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollar: { color: '#8B949E', fontSize: 20, fontWeight: '600' },
  hint: { color: '#00D09C', fontSize: 13, marginTop: 8 },
  info: { color: '#8B949E', fontSize: 13, marginTop: 20, lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00D09C', borderRadius: 12, padding: 15, marginTop: 28, gap: 8,
  },
  btnText: { color: '#0D1117', fontWeight: '700', fontSize: 16 },
});
