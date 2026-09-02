import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Icon } from '../src/components/ui/Icon';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.content}>
        <Icon name="AlertCircle" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Screen Not Found</Text>
        <Text style={styles.message}>The screen you're looking for doesn't exist.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Return to Dashboard</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
  },
  linkText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
