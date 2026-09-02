import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Icon } from './Icon';
import { Button } from './Button';

export interface AppDialogAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  actions: AppDialogAction[];
  onRequestClose?: () => void;
}

/**
 * A premium in-app dialog that replaces React Native's Alert.alert()
 * across the entire application. Supports up to 3 action buttons with
 * default, cancel and destructive styles.
 */
export const AppDialog: React.FC<AppDialogProps> = ({
  visible,
  title,
  message,
  icon,
  iconColor = '#eb0028',
  actions,
  onRequestClose,
}) => {
  if (!visible) return null;

  const cancelAction = actions.find((a) => a.style === 'cancel');
  const destructiveAction = actions.find((a) => a.style === 'destructive');
  const defaultActions = actions.filter(
    (a) => a.style !== 'cancel' && a.style !== 'destructive'
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose ?? cancelAction?.onPress}
    >
      {/* Scrim */}
      <Pressable
        style={styles.scrim}
        onPress={onRequestClose ?? cancelAction?.onPress}
      >
        {/* Dialog box — stop propagation so tapping inside doesn't close */}
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          {icon && (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` },
              ]}
            >
              <Icon name={icon} size={26} color={iconColor} />
            </View>
          )}

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Action buttons */}
          <View style={styles.actionsCol}>
            {/* Destructive first so it's most prominent */}
            {destructiveAction && (
              <Button
                title={destructiveAction.label}
                variant="danger"
                onPress={destructiveAction.onPress}
                style={styles.actionBtn}
              />
            )}
            {defaultActions.map((action) => (
              <Button
                key={action.label}
                title={action.label}
                variant="primary"
                onPress={action.onPress}
                style={styles.actionBtn}
              />
            ))}
            {cancelAction && (
              <Button
                title={cancelAction.label}
                variant="secondary"
                onPress={cancelAction.onPress}
                style={styles.cancelBtn}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Simple "info / toast" variant used for single-button notices ──────────────
export interface AppAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  onClose: () => void;
  closeLabel?: string;
}

export const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  title,
  message,
  icon = 'Info',
  iconColor = '#0a84ff',
  onClose,
  closeLabel = 'OK',
}) => (
  <AppDialog
    visible={visible}
    title={title}
    message={message}
    icon={icon}
    iconColor={iconColor}
    onRequestClose={onClose}
    actions={[{ label: closeLabel, onPress: onClose, style: 'cancel' }]}
  />
);

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#16161e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(235,235,245,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsCol: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
    marginTop: 2,
  },
});
