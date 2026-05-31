import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { stocksAPI } from '../api';
import { addPriceListener, removePriceListener } from '../services/socket';

const { width } = Dimensions.get('window');
const SOCKET_KEY = 'stock_detail';

const RANGES = [
  { label: '1W', days: 7, resolution: 'D' },
  { label: '1M', days: 30, resolution: 'D' },
  { label: '3M', days: 90, resolution: 'W' },
  { label: '1Y', days: 365, resolution: 'M' },
];

export default function StockDetailScreen({ route, navigation }) {
  const { symbol } = route.params;
  const [quote, setQuote] = useState(null);
  const [candles, setCandles] = useState(null);
  const [range, setRange] = useState(RANGES[1]);
  const [loading, setLoading] = useState(true);
  const livePrice = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('AlertsList', { screen: 'CreateAlert', params: { symbol } })}
        >
          <Ionicons name="notifications-outline" size={24} color="#00D09C" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, symbol]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [quoteRes, candleRes] = await Promise.all([
          stocksAPI.quote(symbol),
          stocksAPI.candles(symbol, range.resolution, range.days),
        ]);
        setQuote(quoteRes.data);
        setCandles(candleRes.data);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [symbol, range]);

  useEffect(() => {
    addPriceListener(SOCKET_KEY, ({ symbol: s, price }) => {
      if (s === symbol) {
        livePrice.current = price;
        setQuote((q) => q ? { ...q, c: price } : q);
      }
    });
    return () => removePriceListener(SOCKET_KEY);
  }, [symbol]);

  const chartData = candles?.candles;
  const closePrices = chartData?.c ?? [];
  const timestamps = chartData?.t ?? [];

  const hasData = closePrices.length > 0;
  const priceChange = quote ? quote.c - quote.pc : 0;
  const pctChange = quote?.pc ? (priceChange / quote.pc) * 100 : 0;
  const isUp = pctChange >= 0;
  const color = isUp ? '#00D09C' : '#FF4B4B';

  const labelStep = Math.max(1, Math.floor(timestamps.length / 5));
  const labels = timestamps
    .filter((_, i) => i % labelStep === 0)
    .map((t) => {
      const d = new Date(t * 1000);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  const dataValues = closePrices.filter((_, i) => i % labelStep === 0);

  return (
    <ScrollView style={styles.container}>
      {/* Price Header */}
      <View style={styles.priceSection}>
        <Text style={styles.symbol}>{symbol}</Text>
        {quote && (
          <>
            <Text style={styles.price}>${(quote.c ?? 0).toFixed(2)}</Text>
            <View style={styles.changeRow}>
              <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={18} color={color} />
              <Text style={[styles.changeText, { color }]}>
                {' '}{isUp ? '+' : ''}{priceChange.toFixed(2)} ({isUp ? '+' : ''}{pctChange.toFixed(2)}%) Today
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Range Picker */}
      <View style={styles.rangePicker}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={[styles.rangeBtn, range.label === r.label && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, range.label === r.label && styles.rangeBtnTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        {loading ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator color="#00D09C" />
          </View>
        ) : hasData && dataValues.length > 1 ? (
          <LineChart
            data={{ labels, datasets: [{ data: dataValues }] }}
            width={width - 32}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: '#161B22',
              backgroundGradientFrom: '#161B22',
              backgroundGradientTo: '#161B22',
              decimalPlaces: 2,
              color: (opacity = 1) => isUp ? `rgba(0, 208, 156, ${opacity})` : `rgba(255, 75, 75, ${opacity})`,
              labelColor: () => '#8B949E',
              propsForDots: { r: '3', strokeWidth: '2', stroke: isUp ? '#00D09C' : '#FF4B4B' },
            }}
            bezier
            withShadow={false}
            style={styles.chart}
          />
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No chart data available for this range</Text>
          </View>
        )}
      </View>

      {/* Quote Stats */}
      {quote && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Market Data</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Open', value: `$${(quote.o ?? 0).toFixed(2)}` },
              { label: 'High', value: `$${(quote.h ?? 0).toFixed(2)}` },
              { label: 'Low', value: `$${(quote.l ?? 0).toFixed(2)}` },
              { label: 'Prev Close', value: `$${(quote.pc ?? 0).toFixed(2)}` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Create Alert Button */}
      <TouchableOpacity
        style={styles.alertBtn}
        onPress={() => navigation.navigate('Alerts', { screen: 'CreateAlert', params: { symbol } })}
      >
        <Ionicons name="notifications-outline" size={20} color="#0D1117" />
        <Text style={styles.alertBtnText}>Set Price Alert</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  priceSection: { padding: 20 },
  symbol: { color: '#8B949E', fontSize: 16, fontWeight: '600' },
  price: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', marginVertical: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center' },
  changeText: { fontSize: 15, fontWeight: '600' },
  rangePicker: { flexDirection: 'row', justifyContent: 'space-evenly', marginHorizontal: 16, marginBottom: 12 },
  rangeBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D' },
  rangeBtnActive: { backgroundColor: '#00D09C', borderColor: '#00D09C' },
  rangeBtnText: { color: '#8B949E', fontWeight: '600' },
  rangeBtnTextActive: { color: '#0D1117' },
  chartCard: { marginHorizontal: 16, backgroundColor: '#161B22', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#30363D', marginBottom: 16 },
  chartLoading: { height: 220, justifyContent: 'center', alignItems: 'center' },
  chart: { borderRadius: 8 },
  noData: { height: 220, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: '#8B949E' },
  statsCard: { marginHorizontal: 16, backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#30363D', marginBottom: 16 },
  statsTitle: { color: '#8B949E', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', marginBottom: 12 },
  statLabel: { color: '#8B949E', fontSize: 12, marginBottom: 2 },
  statValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  alertBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00D09C', marginHorizontal: 16, marginBottom: 32,
    borderRadius: 12, padding: 15, gap: 8,
  },
  alertBtnText: { color: '#0D1117', fontWeight: '700', fontSize: 16 },
});
