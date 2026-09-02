import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HapticPressable } from '../ui/HapticPressable';
import { Icon } from '../ui/Icon';

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  visible,
  message,
  onUndo,
  onDismiss,
  durationMs = 4000,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="Trash2" size={18} color="#f43f5e" style={{ marginRight: 8 }} />
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      </View>
      <HapticPressable onPress={onUndo} hapticType="medium" style={styles.undoButton}>
        <Text style={styles.undoText}>UNDO</Text>
      </HapticPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1b2438',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 115, 232, 0.2)',
  },
  undoText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 13,
  },
});
