import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { usePrivacyStore } from '../../src/store/usePrivacyStore';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { triggerHaptic } from '../../src/utils/haptics';

export default function PrivacyAuthModal() {
  const router = useRouter();
  const authenticateAndReveal = usePrivacyStore((state) => state.authenticateAndReveal);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    triggerHaptic.medium();
    const success = await authenticateAndReveal('Unlock financial details');
    setIsAuthenticating(false);
    if (success) {
      triggerHaptic.success();
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.overlay} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.modalCard}>
        <View style={styles.iconCircle}>
          <Icon name="Fingerprint" size={38} color="#eb0028" />
        </View>

        <Text style={styles.title}>Unlock Financial Details</Text>
        <Text style={styles.subtitle}>
          Authenticate using Face ID or Fingerprint to reveal masked amounts.
        </Text>

        <HapticPressable
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
          hapticType="medium"
          style={styles.authButton}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="ScanFace" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.authBtnText}>Touch to Authenticate</Text>
            </View>
          )}
        </HapticPressable>

        <Button
          title="Cancel"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#121216',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  authButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#eb0028',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eb0028',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  authBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
