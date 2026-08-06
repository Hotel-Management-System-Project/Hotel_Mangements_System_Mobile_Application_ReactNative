import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { endpoints } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

function customerName(review) {
  return review.customer_name || review.full_name || review.user_name ||
    `Customer #${review.user_id}`;
}

function ReviewCard({ review, isDark }) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating || 0))));
  return (
    <Card style={[styles.card, isDark && styles.darkCard]} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.customerCopy}>
            <Text variant="titleMedium" style={[styles.customer, isDark && styles.darkText]}>
              {customerName(review)}
            </Text>
            <Text style={styles.verified}>Verified customer</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Icon source="star" size={15} color="#FFFFFF" />
            <Text style={styles.score}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.stars}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</Text>
        <Text style={[styles.comment, isDark && styles.darkSecondary]}>
          {review.comment?.trim() || 'No written comment'}
        </Text>
        <Text style={styles.booking}>Verified booking #{review.booking_id}</Text>
      </Card.Content>
    </Card>
  );
}

export default function HotelReviewsScreen({ navigation, route }) {
  const { isDark } = useAppTheme();
  const { hotelId, hotelName = 'Selected hotel' } = route.params || {};
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReviews(await endpoints.reviewsByHotel(hotelId));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load customer reviews.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useFocusEffect(useCallback(() => { loadReviews(); }, [loadReviews]));

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />
      <FlatList
        style={[styles.list, isDark && styles.darkScreen]}
        contentContainerStyle={styles.content}
        data={reviews}
        keyExtractor={(item, index) => String(item.review_id || index)}
        refreshing={loading}
        onRefresh={loadReviews}
        ListHeaderComponent={
          <>
            <LinearGradient colors={['#7F1D1D', '#DC2626', '#FB7185']} style={styles.hero}>
              <Button icon="arrow-left" textColor="#FFFFFF" style={styles.back}
                onPress={() => navigation.goBack()}>Back</Button>
              <Text variant="headlineLarge" style={styles.hotelName}>{hotelName}</Text>
              <Text style={styles.heroSub}>Ratings shared by verified StayFlow customers</Text>
            </LinearGradient>
            <View style={[styles.summary, isDark && styles.darkCard]}>
              <Text style={styles.average}>★ {average.toFixed(1)}</Text>
              <View>
                <Text variant="titleMedium" style={[styles.summaryTitle, isDark && styles.darkText]}>
                  {reviews.length} customer review{reviews.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.summarySub}>Average rating out of 5</Text>
              </View>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </>
        }
        renderItem={({ item }) => <ReviewCard review={item} isDark={isDark} />}
        ListEmptyComponent={!loading && !error ? (
          <View style={[styles.empty, isDark && styles.darkCard]}>
            <Icon source="star-outline" size={45} color="#E11D2E" />
            <Text variant="titleMedium" style={[styles.emptyTitle, isDark && styles.darkText]}>
              No customer ratings yet
            </Text>
            <Text style={styles.summarySub}>Be the first customer to review this hotel.</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7F1D1D' },
  list: { flex: 1, backgroundColor: '#F5F5F5' },
  darkScreen: { backgroundColor: '#09090B' },
  content: { flexGrow: 1, paddingBottom: 30 },
  hero: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  back: { alignSelf: 'flex-start', marginLeft: -10 },
  hotelName: { marginTop: 14, color: '#FFFFFF', fontWeight: '900' },
  heroSub: { marginTop: 5, color: '#FFE4E6' },
  summary: { margin: 18, padding: 18, borderRadius: 18, backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center', gap: 16 },
  average: { color: '#E11D2E', fontSize: 28, fontWeight: '900' },
  summaryTitle: { color: '#18181B', fontWeight: '800' },
  summarySub: { color: '#71717A', marginTop: 2 },
  card: { marginHorizontal: 18, marginBottom: 12, borderRadius: 18,
    borderColor: '#E11D2E', backgroundColor: '#FFFFFF' },
  darkCard: { backgroundColor: '#18181B' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  customerCopy: { flex: 1 },
  customer: { color: '#18181B', fontWeight: '800' },
  verified: { marginTop: 2, color: '#16A34A', fontSize: 12, fontWeight: '700' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    backgroundColor: '#15803D', flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { color: '#FFFFFF', fontWeight: '900' },
  stars: { marginTop: 12, color: '#F59E0B', fontSize: 22, letterSpacing: 2 },
  comment: { marginTop: 7, color: '#3F3F46', lineHeight: 21 },
  booking: { marginTop: 10, color: '#71717A', fontSize: 12 },
  error: { marginHorizontal: 18, marginBottom: 14, color: '#B91C1C' },
  empty: { margin: 18, padding: 42, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center' },
  emptyTitle: { marginTop: 10, color: '#18181B', fontWeight: '800' },
  darkText: { color: '#FFFFFF' },
  darkSecondary: { color: '#D4D4D8' },
});
