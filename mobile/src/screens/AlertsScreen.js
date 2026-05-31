import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { alertsAPI } from '../api';

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await alertsAPI.list();
      setAlerts(data.alerts);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [fetchAlerts])
  );

  const deleteAlert = (id, symbol) => {
    Alert.alert(
      'Delete Alert',
      `Remove price alert for ${symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await alertsAPI.delete(id);
              setAlerts((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const toggleAlert = async (alert) => {
    try {
      const { data } = await alertsAPI.update(alert.id, { active: !alert.active });
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? data.alert : a)));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderAlert = ({ item }) => {
    const statusColor = item.triggered ? '#FFB700' : item.active ? '#00D09C' : '#8B949E';
    const statusLabel = item.triggered ? 'Triggered' : item.active ? 'Active' : 'Paused';
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.target}>Target: <Text style={styles.targetPrice}>${item.targetPrice.toFixed(2)}</Text></Text>
          </View>
          <View style={styles.actions}>
            <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleAlert(item)}>
            <Ionicons
              name={item.active ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20} color="#8B949E"
            />
            <Text style={styles.actionBtnText}>{item.active ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => deleteAlert(item.id, item.symbol)}>
            <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
            <Text style={[styles.actionBtnText, { color: '#FF4B4B' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00D09C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor="#00D09C" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color="#30363D" />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first price alert</Text>
          </View>
        }
        contentContainerStyle={alerts.length === 0 && styles.emptyContainer}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlert')}
      >
        <Ionicons name="add" size={28} color="#0D1117" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  card: {
    backgroundColor: '#161B22', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#30363D',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  symbol: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  target: { color: '#8B949E', fontSize: 14, marginTop: 4 },
  targetPrice: { color: '#FFFFFF', fontWeight: '600' },
  actions: { alignItems: 'flex-end' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#30363D', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#8B949E', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#8B949E', marginTop: 8, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#00D09C',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00D09C', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
});
