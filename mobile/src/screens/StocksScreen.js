import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { stocksAPI } from '../api';
import { connectSocket, addPriceListener, removePriceListener } from '../services/socket';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const SOCKET_KEY = 'stocks_screen';

export default function StocksScreen({ navigation }) {
  const { logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const priceMap = useRef({});

  const fetchStocks = useCallback(async () => {
    try {
      const { data } = await stocksAPI.list();
      const list = data.stocks.map((s) => ({ ...s, flash: false }));
      priceMap.current = Object.fromEntries(list.map((s) => [s.symbol, s.price]));
      setStocks(list);
    } catch (err) {
      console.error('fetchStocks error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    connectSocket();

    addPriceListener(SOCKET_KEY, ({ symbol, price }) => {
      setStocks((prev) =>
        prev.map((s) => {
          if (s.symbol !== symbol) return s;
          const prev_price = priceMap.current[symbol] ?? price;
          priceMap.current[symbol] = price;
          const change = price - (s.previousClose ?? price);
          const changePercent = s.previousClose ? ((change / s.previousClose) * 100) : 0;
          return { ...s, price, change, changePercent, flash: price !== prev_price };
        })
      );
    });

    return () => removePriceListener(SOCKET_KEY);
  }, [fetchStocks]);

  const chartData = stocks.filter((s) => s.changePercent !== undefined).slice(0, 8);
  const showChart = chartData.length > 0;

  const renderStock = ({ item }) => {
    const isUp = (item.changePercent ?? 0) >= 0;
    const color = isUp ? '#00D09C' : '#FF4B4B';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {item.change !== undefined && (
            <Text style={[styles.badge, { backgroundColor: isUp ? '#003D2E' : '#3D0D0D' }]}>
              <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={12} color={color} />
              {' '}{isUp ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.price, item.flash && { color }]}>${(item.price ?? 0).toFixed(2)}</Text>
          {item.change !== undefined && (
            <Text style={[styles.change, { color }]}>
              {isUp ? '+' : ''}{(item.change ?? 0).toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00D09C" />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={stocks}
      keyExtractor={(item) => item.symbol}
      renderItem={renderStock}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStocks(); }} tintColor="#00D09C" />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Markets</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#8B949E" />
            </TouchableOpacity>
          </View>

          {showChart && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Today's Performance (%)</Text>
              <LineChart
                data={{
                  labels: chartData.map((s) => s.symbol),
                  datasets: [{ data: chartData.map((s) => parseFloat((s.changePercent ?? 0).toFixed(2))) }],
                }}
                width={width - 32}
                height={180}
                yAxisSuffix="%"
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withDots={true}
                withShadow={false}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>All Stocks</Text>
        </View>
      }
    />
  );
}

const chartConfig = {
  backgroundColor: '#161B22',
  backgroundGradientFrom: '#161B22',
  backgroundGradientTo: '#161B22',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 208, 156, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#00D09C' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#8B949E', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  logoutBtn: { padding: 4 },
  chartCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#161B22', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#30363D' },
  chartTitle: { color: '#8B949E', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  chart: { borderRadius: 8 },
  sectionTitle: { color: '#8B949E', fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#161B22', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#30363D',
  },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  symbol: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, color: '#FFFFFF', fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  price: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  change: { fontSize: 13, marginTop: 2 },
});
