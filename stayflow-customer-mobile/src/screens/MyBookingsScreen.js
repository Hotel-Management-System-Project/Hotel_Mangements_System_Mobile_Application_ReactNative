import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Chip,
  Icon,
  IconButton,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { endpoints } from '../services/api';
import { Loading, Notice } from '../components/UI';
import { useAppTheme } from '../context/ThemeContext';

const FILTERS = ['ALL', 'BOOKED', 'CANCELLED'];

function formatDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function bookingStatus(value) {
  return String(value || 'BOOKED').toUpperCase();
}

function statusColors(status) {
  if (status === 'CANCELLED') {
    return { background: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' };
  }
  if (status === 'COMPLETED') {
    return { background: '#E0E7FF', text: '#3730A3', dot: '#6366F1' };
  }
  return { background: '#DCFCE7', text: '#166534', dot: '#22C55E' };
}

function paymentDetails(payment) {
  const method = String(payment?.method || 'NOT_SELECTED').toUpperCase();
  const status = String(payment?.status || 'NOT_RECORDED').toUpperCase();
  const paid = status === 'PAID';
  const failed = status === 'FAILED';

  return {
    label: `${method === 'RAZORPAY' ? 'ONLINE' : method === 'CASH' ? 'CASH' : 'NO PAYMENT'} • ${status === 'NOT_RECORDED' ? 'NOT RECORDED' : status}`,
    icon: paid ? 'check-decagram' : failed ? 'alert-circle-outline' : 'clock-outline',
    background: paid ? '#DCFCE7' : failed ? '#FEE2E2' : '#FEF3C7',
    color: paid ? '#15803D' : failed ? '#B91C1C' : '#A16207',
  };
}

function recordId(value, ...keys) {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) {
      return value[key];
    }
  }
  return undefined;
}

function BookingCard({ booking, onCancel, cancelling, isDark }) {
  const status = bookingStatus(booking.status);
  const colors = statusColors(status);
  const payment = paymentDetails(booking.payment);
  const canCancel = !['CANCELLED', 'COMPLETED'].includes(status);

  return (
    <View style={[styles.bookingCard, isDark && styles.darkCard]}>
      <View style={styles.cardTopRow}>
        <View style={styles.bookingIdentity}>
          <View style={styles.bookingIcon}>
            <Icon source="calendar-check-outline" size={23} color="#E11D2E" />
          </View>
          <View>
            <Text style={styles.bookingLabel}>BOOKING ID</Text>
            <Text
              variant="titleMedium"
              style={[
                styles.bookingNumber,
                isDark && styles.darkPrimaryText,
              ]}
            >
              #{booking.bookingId}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: colors.background }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {status}
          </Text>
        </View>
      </View>

      <View style={[styles.hotelPanel, isDark && styles.darkPanel]}>
        <View style={styles.hotelIcon}>
          <Icon source="office-building-marker" size={24} color="#E11D2E" />
        </View>
        <View style={styles.hotelCopy}>
          <Text style={styles.hotelLabel}>BOOKED HOTEL</Text>
          <Text
            numberOfLines={1}
            style={[styles.hotelName, isDark && styles.darkPrimaryText]}
          >
            {booking.hotelName || 'Hotel information unavailable'}
          </Text>
          {!!booking.roomNumber && (
            <View style={styles.roomRow}>
              <View style={styles.roomNumberBadge}>
                <Icon source="door" size={14} color="#FFFFFF" />
                <Text style={styles.roomNumberText}>
                  ROOM #{booking.roomNumber}
                </Text>
              </View>
              {!!booking.roomType && (
                <Text style={styles.roomDetails}>{booking.roomType}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.datePanel, isDark && styles.darkPanel]}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>CHECK-IN</Text>
          <Text
            style={[styles.dateValue, isDark && styles.darkPrimaryText]}
          >
            {formatDate(booking.checkInDate)}
          </Text>
          <Text style={styles.dateTime}>After 12:00 PM</Text>
        </View>

        <View style={styles.dateJourney}>
          <View style={styles.journeyDot} />
          <View style={styles.journeyLine} />
          <Icon source="bed-outline" size={20} color="#E11D2E" />
          <View style={styles.journeyLine} />
          <View style={styles.journeyDot} />
        </View>

        <View style={[styles.dateColumn, styles.checkoutColumn]}>
          <Text style={styles.dateLabel}>CHECK-OUT</Text>
          <Text
            style={[styles.dateValue, isDark && styles.darkPrimaryText]}
          >
            {formatDate(booking.checkOutDate)}
          </Text>
          <Text style={styles.dateTime}>Before 11:00 AM</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Total booking value</Text>
          <Text style={[styles.amount, isDark && styles.darkPrimaryText]}>
            ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: payment.background }]}>
          <Icon source={payment.icon} size={17} color={payment.color} />
          <Text style={[styles.paymentText, { color: payment.color }]}>
            {payment.label}
          </Text>
        </View>
      </View>

      {canCancel && (
        <Button
          mode="outlined"
          icon="close-circle-outline"
          textColor="#DC2626"
          style={styles.cancelButton}
          contentStyle={styles.cancelButtonContent}
          loading={cancelling}
          disabled={cancelling}
          onPress={onCancel}
        >
          Cancel booking
        </Button>
      )}
    </View>
  );
}

export default function MyBookingsScreen() {
  const { isDark } = useAppTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const [response, roomsResponse, hotelsResponse] = await Promise.all([
        endpoints.myBookings(),
        endpoints.rooms(),
        endpoints.hotels(),
      ]);
      const bookingList = Array.isArray(response) ? response : [];
      const rooms = Array.isArray(roomsResponse) ? roomsResponse : [];
      const hotels = Array.isArray(hotelsResponse) ? hotelsResponse : [];

      const enrichedBookings = await Promise.all(
        bookingList.map(async (booking) => {
          try {
            const [responseRows, payment] = await Promise.all([
              endpoints.bookingRooms(booking.bookingId),
              endpoints.bookingPayment(booking.bookingId).catch(() => null),
            ]);
            const rows = Array.isArray(responseRows)
              ? responseRows
              : responseRows
                ? [responseRows]
                : [];
            const bookingRoom = rows[0];
            const roomId = recordId(
              bookingRoom,
              'roomId',
              'room_id',
            ) ?? recordId(bookingRoom?.room, 'roomId', 'room_id');
            const room =
              bookingRoom?.room ||
              rooms.find(
                (item) =>
                  Number(recordId(item, 'roomId', 'room_id')) === Number(roomId),
              );
            const hotelId =
              recordId(room, 'hotelId', 'hotel_id') ??
              recordId(room?.hotel, 'hotelId', 'hotel_id');
            const hotel =
              room?.hotel ||
              hotels.find(
                (item) =>
                  Number(recordId(item, 'hotelId', 'hotel_id')) ===
                  Number(hotelId),
              );

            return {
              ...booking,
              hotelName: hotel?.hotelName || hotel?.hotel_name,
              roomNumber: room?.roomNumber || room?.room_number,
              roomType: room?.roomType || room?.room_type,
              payment,
            };
          } catch {
            return booking;
          }
        }),
      );

      setBookings(enrichedBookings);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visibleBookings = useMemo(
    () =>
      activeFilter === 'ALL'
        ? bookings
        : bookings.filter(
            (booking) => bookingStatus(booking.status) === activeFilter,
          ),
    [activeFilter, bookings],
  );

  const upcomingCount = bookings.filter(
    (booking) => bookingStatus(booking.status) === 'BOOKED',
  ).length;
  const cancelledCount = bookings.filter(
    (booking) => bookingStatus(booking.status) === 'CANCELLED',
  ).length;

  const cancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel booking?',
      'This reservation will be cancelled. This action cannot be undone.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(bookingId);
            try {
              await endpoints.cancelBooking(bookingId);
              setMessage('Booking cancelled successfully.');
              await load();
            } catch (error) {
              setMessage(error.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />

      <FlatList
        style={[styles.list, isDark && styles.darkScreen]}
        data={visibleBookings}
        keyExtractor={(booking) => String(booking.bookingId)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isDark && styles.darkScreen,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={['#E11D2E']}
            tintColor="#E11D2E"
          />
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#7F1D1D', '#DC2626', '#FB7185']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerTopRow}>
                <View>
                  <Text style={styles.headerEyebrow}>YOUR TRIPS</Text>
                  <Text style={styles.headerTitle}>My Bookings</Text>
                </View>
                <IconButton
                  icon="bell-outline"
                  iconColor="#FFFFFF"
                  containerColor="rgba(255,255,255,0.16)"
                  size={22}
                />
              </View>
              <Text style={styles.headerSubtitle}>
                View and manage all your StayFlow reservations.
              </Text>

              <View style={styles.summaryCards}>
                <View style={[styles.summaryCard, isDark && styles.darkCard]}>
                  <Icon source="calendar-clock-outline" size={22} color="#E11D2E" />
                  <Text
                    style={[
                      styles.summaryValue,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    {upcomingCount}
                  </Text>
                  <Text style={styles.summaryLabel}>Upcoming</Text>
                </View>
                <View style={[styles.summaryCard, isDark && styles.darkCard]}>
                  <Icon source="calendar-multiple" size={22} color="#E11D2E" />
                  <Text
                    style={[
                      styles.summaryValue,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    {bookings.length}
                  </Text>
                  <Text style={styles.summaryLabel}>All trips</Text>
                </View>
                <View style={[styles.summaryCard, isDark && styles.darkCard]}>
                  <Icon source="calendar-remove-outline" size={22} color="#E11D2E" />
                  <Text
                    style={[
                      styles.summaryValue,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    {cancelledCount}
                  </Text>
                  <Text style={styles.summaryLabel}>Cancelled</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.contentHeader}>
              <View>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.sectionTitle,
                    isDark && styles.darkPrimaryText,
                  ]}
                >
                  Your reservations
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {visibleBookings.length} booking
                  {visibleBookings.length === 1 ? '' : 's'} found
                </Text>
              </View>
              <Icon source="filter-variant" size={25} color="#E11D2E" />
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((filter) => (
                <Chip
                  key={filter}
                  selected={activeFilter === filter}
                  showSelectedCheck={false}
                  style={[
                    styles.filterChip,
                    isDark && styles.darkChip,
                    activeFilter === filter && styles.activeFilterChip,
                  ]}
                  textStyle={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  {filter === 'ALL'
                    ? 'All'
                    : filter.charAt(0) + filter.slice(1).toLowerCase()}
                </Chip>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, isDark && styles.darkScreen]}>
            <View style={styles.emptyIcon}>
              <Icon source="calendar-blank-outline" size={34} color="#E11D2E" />
            </View>
            <Text
              variant="titleLarge"
              style={[styles.emptyTitle, isDark && styles.darkPrimaryText]}
            >
              No bookings found
            </Text>
            <Text style={styles.emptySubtitle}>
              Book a verified hotel and your reservation will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            cancelling={cancellingId === item.bookingId}
            isDark={isDark}
            onCancel={() => cancelBooking(item.bookingId)}
          />
        )}
      />

      <Notice message={message} onDismiss={() => setMessage('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7F1D1D',
  },
  list: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 28,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  headerSubtitle: {
    marginTop: 6,
    color: '#FEE2E2',
    fontSize: 13,
  },
  summaryCards: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 9,
  },
  summaryCard: {
    flex: 1,
    minHeight: 92,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  summaryValue: {
    marginTop: 6,
    color: '#18181B',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#18181B',
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 12,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  activeFilterChip: {
    borderColor: '#E11D2E',
    backgroundColor: '#E11D2E',
  },
  filterText: {
    color: '#52525B',
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  bookingCard: {
    marginHorizontal: 20,
    marginBottom: 17,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 13,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
  },
  bookingLabel: {
    color: '#A1A1AA',
    fontSize: 9,
    fontWeight: '800',
  },
  bookingNumber: {
    color: '#18181B',
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  datePanel: {
    marginTop: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
  },
  hotelPanel: {
    marginTop: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
  },
  hotelIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
  },
  hotelCopy: {
    flex: 1,
    marginLeft: 11,
  },
  hotelLabel: {
    color: '#A1A1AA',
    fontSize: 8,
    fontWeight: '900',
  },
  hotelName: {
    marginTop: 2,
    color: '#18181B',
    fontSize: 15,
    fontWeight: '900',
  },
  roomDetails: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
  },
  roomRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomNumberBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    backgroundColor: '#E11D2E',
  },
  roomNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  dateColumn: {
    flex: 1,
  },
  checkoutColumn: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    color: '#A1A1AA',
    fontSize: 8,
    fontWeight: '900',
  },
  dateValue: {
    marginTop: 4,
    color: '#18181B',
    fontSize: 12,
    fontWeight: '900',
  },
  dateTime: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 9,
  },
  dateJourney: {
    width: 82,
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#E11D2E',
  },
  journeyLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FDA4AF',
  },
  amountRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    color: '#71717A',
    fontSize: 10,
  },
  amount: {
    marginTop: 2,
    color: '#18181B',
    fontSize: 22,
    fontWeight: '900',
  },
  paymentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#F0FDF4',
  },
  paymentText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  cancelButton: {
    marginTop: 15,
    borderColor: '#FCA5A5',
  },
  cancelButtonContent: {
    height: 44,
  },
  emptyState: {
    minHeight: 300,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFE4E6',
  },
  emptyTitle: {
    marginTop: 16,
    color: '#18181B',
    fontWeight: '900',
  },
  emptySubtitle: {
    maxWidth: 280,
    marginTop: 6,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 20,
  },
  darkScreen: {
    backgroundColor: '#09090B',
  },
  darkCard: {
    backgroundColor: '#18181B',
  },
  darkPanel: {
    backgroundColor: '#27272A',
  },
  darkChip: {
    borderColor: '#3F3F46',
    backgroundColor: '#27272A',
  },
  darkPrimaryText: {
    color: '#FFFFFF',
  },
});
