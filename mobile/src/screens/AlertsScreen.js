import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { alertsAPI } from '../api';
import { COLORS, cardStyle } from '../utils/theme';
import { formatPrice } from '../utils/format';

const getStatusColor = (triggered, active) => {
  if (triggered) return COLORS.warning;
  return active ? COLORS.up : COLORS.muted;
};

const getStatusLabel = (triggered, active) => {
  if (triggered) return 'Triggered';
  return active ? 'Active' : 'Paused';
};

export const AlertsScreen = ({ navigation }) => {
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
    }, [fetchAlerts]),
  );

  const deleteAlert = (id, symbol) => {
    Alert.alert(
      'Delete Alert',
      `Remove price alert for ${symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await alertsAPI.delete(id);
              setAlerts((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
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
    const statusColor = getStatusColor(item.triggered, item.active);
    const statusLabel = getStatusLabel(item.triggered, item.active);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.target}>
              Target:
              {' '}
              <Text style={styles.targetPrice}>{formatPrice(item.targetPrice)}</Text>
            </Text>
          </View>
          <View style={styles.actions}>
            <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleAlert(item)}>
            <Ionicons
              name={item.active ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={COLORS.muted}
            />
            <Text style={styles.actionBtnText}>{item.active ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => deleteAlert(item.id, item.symbol)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.down} />
            <Text style={[styles.actionBtnText, { color: COLORS.down }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.up} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
            tintColor={COLORS.up}
          />
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first price alert</Text>
          </View>
        )}
        contentContainerStyle={alerts.length === 0 && styles.emptyContainer}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlert')}
      >
        <Ionicons name="add" size={28} color={COLORS.bg} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  card: { ...cardStyle, marginHorizontal: 16, marginTop: 12, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  symbol: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  target: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  targetPrice: { color: COLORS.text, fontWeight: '600' },
  actions: { alignItems: 'flex-end' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { color: COLORS.muted, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: COLORS.muted, marginTop: 8, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.up,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.up,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
