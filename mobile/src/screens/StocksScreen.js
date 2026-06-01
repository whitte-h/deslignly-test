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
import { COLORS, cardStyle } from '../utils/theme';
import { formatPrice, formatPercent, formatChange, changeColor } from '../utils/format';
import { makeChartConfig } from '../utils/chartConfig';

const { width } = Dimensions.get('window');
const SOCKET_KEY = 'stocks_screen';

const StocksScreen = ({ navigation }) => {
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
      // eslint-disable-next-line no-console
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
      setStocks((prev) => prev.map((s) => {
        if (s.symbol !== symbol) return s;
        const prevPrice = priceMap.current[symbol] ?? price;
        priceMap.current[symbol] = price;
        const change = price - (s.previousClose ?? price);
        const changePercent = s.previousClose ? ((change / s.previousClose) * 100) : 0;
        return {
          ...s, price, change, changePercent, flash: price !== prevPrice,
        };
      }));
    });

    return () => removePriceListener(SOCKET_KEY);
  }, [fetchStocks]);

  const chartData = stocks.filter((s) => s.changePercent !== undefined).slice(0, 8);
  const showChart = chartData.length > 0;

  const renderStock = ({ item }) => {
    const color = changeColor(item.changePercent);
    const isUp = (item.changePercent ?? 0) >= 0;
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
              {' '}
              {formatPercent(item.changePercent)}
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.price, item.flash && { color }]}>{formatPrice(item.price)}</Text>
          {item.change !== undefined && (
            <Text style={[styles.change, { color }]}>{formatChange(item.change)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.up} />
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
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchStocks(); }}
          tintColor={COLORS.up}
        />
      )}
      ListHeaderComponent={(
        <View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Markets</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {showChart && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Today&apos;s Performance (%)</Text>
              <LineChart
                data={{
                  labels: chartData.map((s) => s.symbol),
                  datasets: [{
                    data: chartData.map((s) => parseFloat((s.changePercent ?? 0).toFixed(2))),
                  }],
                }}
                width={width - 32 - 24}
                height={180}
                yAxisSuffix="%"
                chartConfig={makeChartConfig()}
                bezier
                style={styles.chart}
                withDots
                withShadow={false}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>All Stocks</Text>
        </View>
      )}
    />
  );
};

export default StocksScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { color: COLORS.muted, marginTop: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  logoutBtn: { padding: 4 },
  chartCard: { ...cardStyle, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  chartTitle: { color: COLORS.muted, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  chart: { borderRadius: 8 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    ...cardStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
  },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  symbol: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  price: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  change: { fontSize: 13, marginTop: 2 },
});
