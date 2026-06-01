import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, cardStyle } from '../utils/theme';

// Overflow ("hamburger") menu rendered in the navigation header.
// Tapping the icon opens a dropdown anchored top-right; currently holds Logout.
export const HeaderMenu = () => {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const handleLogout = () => {
    close();
    logout();
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={8} style={styles.trigger}>
        <Ionicons name="menu" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Absorbs taps so pressing the menu body doesn't close it */}
          <Pressable style={[styles.menu, { top: insets.top + 48 }]} onPress={() => {}}>
            <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.down} />
              <Text style={styles.itemText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: { paddingHorizontal: 4 },
  backdrop: { flex: 1 },
  menu: {
    ...cardStyle,
    position: 'absolute',
    right: 8,
    minWidth: 160,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
});
