import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Insight } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { HapticPressable } from '../ui/HapticPressable';

interface InsightsCarouselProps {
  insights: Insight[];
}

export const InsightsCarousel: React.FC<InsightsCarouselProps> = ({ insights }) => {
  const router = useRouter();

  if (insights.length === 0) return null;

  const getInsightTheme = (type: Insight['type']) => {
    switch (type) {
      case 'danger':
        return {
          icon: 'AlertCircle',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.25)',
        };
      case 'warning':
        return {
          icon: 'AlertTriangle',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
        };
      case 'success':
        return {
          icon: 'CheckCircle2',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
        };
      default:
        return {
          icon: 'Lightbulb',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.25)',
        };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Icon name="Sparkles" size={16} color="#1a73e8" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Smart Insights</Text>
        </View>
        <Text style={styles.countBadge}>{insights.length} active</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={288} // card width + gap
      >
        {insights.map((item) => {
          const theme = getInsightTheme(item.type);

          return (
            <Card
              key={item.id}
              style={[
                styles.insightCard,
                { backgroundColor: '#131b2c', borderColor: theme.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.bg }]}>
                  <Icon name={theme.icon} size={16} color={theme.color} />
                </View>
                <Text style={[styles.insightTitle, { color: theme.color }]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>

              <Text style={styles.insightMessage} numberOfLines={3}>
                {item.message}
              </Text>

              {item.actionLabel && item.actionRoute && (
                <HapticPressable
                  onPress={() => router.push(item.actionRoute as any)}
                  hapticType="light"
                  style={styles.actionRow}
                >
                  <Text style={[styles.actionText, { color: theme.color }]}>
                    {item.actionLabel}
                  </Text>
                  <Icon name="ChevronRight" size={14} color={theme.color} />
                </HapticPressable>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  countBadge: {
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  insightCard: {
    width: 276,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  insightMessage: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
});
