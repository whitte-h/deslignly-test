import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertsAPI, stocksAPI } from '../api';
import { DEFAULT_SYMBOLS } from '../constants';
import { COLORS, cardStyle } from '../utils/theme';
import { formatPrice } from '../utils/format';

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
      Alert.alert('Success', `Alert created for ${symbol} at ${formatPrice(price)}`, [
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
                <Text style={styles.currentPrice}>Current: {formatPrice(currentPrice)}</Text>
              )}
            </View>
            <Ionicons name="swap-horizontal-outline" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Search (e.g. AAPL, Tesla)"
                placeholderTextColor={COLORS.muted}
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); searchSymbols(t); }}
                autoCapitalize="characters"
              />
              {searching && <ActivityIndicator color={COLORS.up} style={{ marginLeft: 8 }} />}
            </View>

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
            placeholderTextColor={COLORS.muted}
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
        {currentPrice !== null && (
          <TouchableOpacity onPress={() => setTargetPrice((currentPrice * 1.05).toFixed(2))}>
            <Text style={styles.hint}>
              <Ionicons name="flash-outline" size={13} color={COLORS.up} /> Tap to set 5% above current ({formatPrice(currentPrice * 1.05)})
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.info}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.muted} />
          {' '}You'll receive a push notification when the price reaches your target.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={20} color={COLORS.bg} />
              <Text style={styles.btnText}>Create Alert</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { padding: 20 },
  label: { color: COLORS.muted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  sublabel: { color: COLORS.muted, fontSize: 12, marginTop: 12, marginBottom: 8 },
  input: {
    ...cardStyle,
    borderRadius: 10, padding: 14, color: COLORS.text, fontSize: 16,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  selectedSymbol: {
    ...cardStyle,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderColor: COLORS.up, borderRadius: 10, padding: 14,
  },
  selectedText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  currentPrice: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { ...cardStyle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  results: { ...cardStyle, borderRadius: 10, marginTop: 8, overflow: 'hidden' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultSymbol: { color: COLORS.text, fontWeight: '700' },
  resultDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollar: { color: COLORS.muted, fontSize: 20, fontWeight: '600' },
  hint: { color: COLORS.up, fontSize: 13, marginTop: 8 },
  info: { color: COLORS.muted, fontSize: 13, marginTop: 20, lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.up, borderRadius: 12, padding: 15, marginTop: 28, gap: 8,
  },
  btnText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    alignItems: 'center', padding: 15, marginTop: 10,
  },
  cancelBtnText: { color: COLORS.muted, fontSize: 16, fontWeight: '600' },
});
