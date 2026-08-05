import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Icon, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { endpoints } from '../services/api';
import { Notice } from '../components/UI';
import { useAppTheme } from '../context/ThemeContext';

const days = (checkIn, checkOut) =>
  Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = (value, fallback = new Date()) => {
  if (!value) return fallback;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const displayDate = (value) =>
  value
    ? fromIsoDate(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Choose date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(first, second) {
  return first && second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
}

function CalendarPicker({
  visible,
  mode,
  checkIn,
  checkOut,
  isDark,
  onClose,
  onSelect,
}) {
  const [month, setMonth] = useState(new Date());

  React.useEffect(() => {
    if (visible) {
      setMonth(new Date((mode === 'checkOut' && checkOut) || checkIn || Date.now()));
    }
  }, [checkIn, checkOut, mode, visible]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minimumDate = mode === 'checkOut' && checkIn
    ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1)
    : today;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.calendarCard, isDark && styles.darkCard]} onPress={() => {}}>
          <View style={styles.calendarTitleRow}>
            <View>
              <Text style={styles.calendarEyebrow}>
                {mode === 'checkIn' ? 'SELECT CHECK-IN' : 'SELECT CHECK-OUT'}
              </Text>
              <Text variant="titleLarge" style={[styles.calendarTitle, isDark && styles.darkPrimaryText]}>
                {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <IconButton icon="close" size={21} onPress={onClose} />
          </View>

          <View style={styles.monthControls}>
            <IconButton
              icon="chevron-left"
              mode="contained-tonal"
              onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}
            />
            <View style={styles.selectedDates}>
              <Text style={styles.selectedDateText}>
                {displayDate(checkIn ? toIsoDate(checkIn) : '')} →{' '}
                {displayDate(checkOut ? toIsoDate(checkOut) : '')}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              mode="contained-tonal"
              onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}
            />
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {cells.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const date = new Date(year, monthIndex, day);
              const disabled = date < minimumDate;
              const selected = sameDay(date, checkIn) || sameDay(date, checkOut);
              const inRange = checkIn && checkOut && date > checkIn && date < checkOut;

              return (
                <Pressable
                  key={`${year}-${monthIndex}-${day}`}
                  disabled={disabled}
                  onPress={() => onSelect(date)}
                  style={[
                    styles.dayCell,
                    inRange && styles.dayInRange,
                    selected && styles.selectedDay,
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    isDark && styles.darkPrimaryText,
                    disabled && styles.disabledDayText,
                    selected && styles.selectedDayText,
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.calendarHint}>
            {mode === 'checkIn'
              ? 'Choose your arrival date. Next, select check-out.'
              : 'Check-out must be after the check-in date.'}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RazorpayModal({ order, visible, onResult }) {
  if (!order) return null;

  const options = JSON.stringify({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: 'StayFlow',
    description: 'Hotel room booking',
    order_id: order.orderId,
    theme: { color: '#E11D2E' },
    modal: { confirm_close: true },
  }).replace(/<\//g, '<\\/');

  const html = `<!doctype html>
    <html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
    <body style="background:#fff">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
        const options = ${options};
        options.handler = function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }));
        };
        options.modal.ondismiss = function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismissed' }));
        };
        const checkout = new Razorpay(options);
        checkout.on('payment.failed', function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'failed',
            message: response.error && response.error.description
          }));
        });
        checkout.open();
      </script>
    </body></html>`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onResult({ type: 'dismissed' })}>
      <SafeAreaView style={styles.checkoutScreen}>
        <View style={styles.checkoutHeader}>
          <Text style={styles.checkoutTitle}>Secure online payment</Text>
          <IconButton icon="close" onPress={() => onResult({ type: 'dismissed' })} />
        </View>
        <WebView
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          onMessage={(event) => {
            try {
              onResult(JSON.parse(event.nativeEvent.data));
            } catch {
              onResult({ type: 'failed', message: 'Invalid payment response' });
            }
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function BookingScreen({ route, navigation }) {
  const {
    hotel,
    room,
    checkInDate: initialCheckInDate = '',
    checkOutDate: initialCheckOutDate = '',
  } = route.params;
  const { isDark } = useAppTheme();
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate);
  const [editingDates, setEditingDates] = useState(
    !initialCheckInDate || !initialCheckOutDate,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [calendarMode, setCalendarMode] = useState('checkIn');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  const openDatePicker = (mode) => {
    setCalendarMode(mode === 'checkOut' && !checkInDate ? 'checkIn' : mode);
    setCalendarOpen(true);
  };

  const selectDate = (date) => {
    if (calendarMode === 'checkIn') {
      setCheckInDate(toIsoDate(date));
      if (checkOutDate && fromIsoDate(checkOutDate) <= date) {
        setCheckOutDate('');
      }
      setCalendarMode('checkOut');
      return;
    }

    setCheckOutDate(toIsoDate(date));
    setCalendarOpen(false);
  };

  const nights = useMemo(
    () =>
      checkInDate && checkOutDate ? days(checkInDate, checkOutDate) : 1,
    [checkInDate, checkOutDate],
  );
  const total = nights * Number(room.pricePerNight || 0);

  const submit = async () => {
    if (!checkInDate || !checkOutDate) {
      setMessage('Select both check-in and check-out dates.');
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setMessage('Check-out must be after the check-in date.');
      return;
    }

    let createdBookingId = null;
    setBusy(true);
    try {
      const available = await endpoints.roomAvailability(
        room.roomId,
        checkInDate,
        checkOutDate,
      );
      if (!available) {
        setMessage('This room is unavailable for the selected dates.');
        return;
      }

      const booking = await endpoints.createBooking({
        checkInDate,
        checkOutDate,
        totalAmount: total,
        status: 'BOOKED',
      });
      createdBookingId = booking.bookingId;
      await endpoints.addBookingRoom({
        bookingId: booking.bookingId,
        roomId: room.roomId,
        pricePerNight: room.pricePerNight,
      });

      if (paymentMethod === 'CASH') {
        await endpoints.createCashPayment(booking.bookingId);
        setMessage('Booking confirmed. Pay cash at the hotel.');
        setTimeout(() => navigation.popToTop(), 900);
      } else {
        const order = await endpoints.createRazorpayOrder(booking.bookingId);
        setPendingBookingId(booking.bookingId);
        setRazorpayOrder(order);
      }
    } catch (error) {
      if (createdBookingId) {
        try {
          await endpoints.cancelBooking(createdBookingId);
        } catch {
          // Keep the original checkout error visible to the customer.
        }
      }
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRazorpayResult = async (result) => {
    setRazorpayOrder(null);
    if (result.type === 'success') {
      setBusy(true);
      try {
        await endpoints.verifyRazorpayPayment({
          razorpayOrderId: result.razorpayOrderId,
          razorpayPaymentId: result.razorpayPaymentId,
          razorpaySignature: result.razorpaySignature,
        });
        setMessage('Online payment verified and booking confirmed.');
        setTimeout(() => navigation.popToTop(), 900);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (pendingBookingId) {
      try {
        await endpoints.cancelBooking(pendingBookingId);
      } catch {
        // The backend remains the source of truth if cancellation fails.
      }
    }
    setMessage(result.message || 'Online payment was cancelled.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />
      <KeyboardAvoidingView
        style={[styles.screen, isDark && styles.darkScreen]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDark && styles.darkScreen,
          ]}
        >
          <LinearGradient
            colors={['#7F1D1D', '#DC2626', '#FB7185']}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <IconButton
                icon="arrow-left"
                iconColor="#FFFFFF"
                containerColor="rgba(255,255,255,0.16)"
                onPress={() => navigation.goBack()}
              />
              <Text style={styles.headerLabel}>Complete booking</Text>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={styles.hotelName}>{hotel.hotelName}</Text>
            <Text style={styles.roomName}>
              Room #{room.roomNumber} · {room.roomType}
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={[styles.summaryCard, isDark && styles.darkCard]}>
              <View style={styles.summaryIcon}>
                <Icon source="bed-outline" size={26} color="#E11D2E" />
              </View>
              <View style={styles.summaryCopy}>
                <Text
                  style={[
                    styles.summaryTitle,
                    isDark && styles.darkPrimaryText,
                  ]}
                >
                  {room.roomType} room
                </Text>
                <Text style={styles.summarySubtitle}>
                  Up to {room.capacity} guests · ₹
                  {Number(room.pricePerNight).toLocaleString('en-IN')} per night
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text
                variant="titleLarge"
                style={[styles.sectionTitle, isDark && styles.darkPrimaryText]}
              >
                {editingDates ? 'Select dates' : 'Your stay'}
              </Text>
              {!editingDates && (
                <Button compact textColor="#E11D2E" onPress={() => setEditingDates(true)}>
                  Change dates
                </Button>
              )}
            </View>

            {editingDates ? (
              <View style={[styles.formCard, isDark && styles.darkCard]}>
                <Pressable
                  style={[styles.calendarField, isDark && styles.darkInput]}
                  onPress={() => openDatePicker('checkIn')}
                >
                  <Icon source="calendar-arrow-right" size={24} color="#E11D2E" />
                  <View style={styles.calendarFieldCopy}>
                    <Text style={styles.calendarLabel}>CHECK-IN</Text>
                    <Text style={[styles.calendarValue, isDark && styles.darkPrimaryText]}>
                      {displayDate(checkInDate)}
                    </Text>
                  </View>
                  <Icon source="chevron-down" size={22} color="#71717A" />
                </Pressable>

                <Pressable
                  style={[styles.calendarField, isDark && styles.darkInput]}
                  onPress={() => openDatePicker('checkOut')}
                >
                  <Icon source="calendar-arrow-left" size={24} color="#E11D2E" />
                  <View style={styles.calendarFieldCopy}>
                    <Text style={styles.calendarLabel}>CHECK-OUT</Text>
                    <Text style={[styles.calendarValue, isDark && styles.darkPrimaryText]}>
                      {displayDate(checkOutDate)}
                    </Text>
                  </View>
                  <Icon source="chevron-down" size={22} color="#71717A" />
                </Pressable>

                {checkInDate && checkOutDate && (
                  <Button mode="outlined" textColor="#E11D2E" onPress={() => setEditingDates(false)}>
                    Use these dates
                  </Button>
                )}
              </View>
            ) : (
              <View style={[styles.dateSummary, isDark && styles.darkCard]}>
                <View style={styles.dateItem}>
                  <Icon source="calendar-arrow-right" size={23} color="#E11D2E" />
                  <View>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <Text style={[styles.dateValue, isDark && styles.darkPrimaryText]}>
                      {checkInDate}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateItem}>
                  <Icon source="calendar-arrow-left" size={23} color="#E11D2E" />
                  <View>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <Text style={[styles.dateValue, isDark && styles.darkPrimaryText]}>
                      {checkOutDate}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.totalCard, isDark && styles.darkCard]}>
              <View>
                <Text style={styles.totalLabel}>TOTAL BOOKING VALUE</Text>
                <Text
                  style={[styles.totalAmount, isDark && styles.darkPrimaryText]}
                >
                  ₹{total.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.nightsText}>
                  {nights} night{nights === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.secureBadge}>
                <Icon source="shield-check" size={22} color="#15803D" />
                <Text style={styles.secureText}>Secure</Text>
              </View>
            </View>

            <View style={[styles.paymentCard, isDark && styles.darkCard]}>
              <Text style={[styles.paymentHeading, isDark && styles.darkPrimaryText]}>
                Payment method
              </Text>
              <Pressable
                onPress={() => setPaymentMethod('CASH')}
                style={[
                  styles.paymentOption,
                  paymentMethod === 'CASH' && styles.paymentOptionSelected,
                ]}
              >
                <Icon source="cash" size={25} color="#E11D2E" />
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentTitle, isDark && styles.darkPrimaryText]}>Cash at hotel</Text>
                  <Text style={styles.paymentSubtitle}>Pay when you arrive at the property</Text>
                </View>
                <Icon
                  source={paymentMethod === 'CASH' ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color="#E11D2E"
                />
              </Pressable>
              <Pressable
                onPress={() => setPaymentMethod('RAZORPAY')}
                style={[
                  styles.paymentOption,
                  paymentMethod === 'RAZORPAY' && styles.paymentOptionSelected,
                ]}
              >
                <Icon source="credit-card-check-outline" size={25} color="#E11D2E" />
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentTitle, isDark && styles.darkPrimaryText]}>Pay online</Text>
                  <Text style={styles.paymentSubtitle}>UPI, cards, netbanking and wallets via Razorpay</Text>
                </View>
                <Icon
                  source={paymentMethod === 'RAZORPAY' ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color="#E11D2E"
                />
              </Pressable>
            </View>

            <Button
              mode="contained"
              icon="check-circle-outline"
              buttonColor="#E11D2E"
              textColor="#FFFFFF"
              contentStyle={styles.confirmButton}
              loading={busy}
              disabled={busy}
              onPress={submit}
            >
              {paymentMethod === 'CASH' ? 'Confirm cash booking' : 'Pay securely online'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CalendarPicker
        visible={calendarOpen}
        mode={calendarMode}
        checkIn={checkInDate ? fromIsoDate(checkInDate) : null}
        checkOut={checkOutDate ? fromIsoDate(checkOutDate) : null}
        isDark={isDark}
        onClose={() => setCalendarOpen(false)}
        onSelect={selectDate}
      />
      <RazorpayModal
        visible={!!razorpayOrder}
        order={razorpayOrder}
        onResult={handleRazorpayResult}
      />
      <Notice message={message} onDismiss={() => setMessage('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7F1D1D' },
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, backgroundColor: '#F5F5F5' },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  headerSpacer: { width: 48 },
  hotelName: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  roomName: { marginTop: 4, color: '#FEE2E2', fontSize: 14 },
  content: { padding: 20, gap: 16 },
  summaryCard: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
  },
  summaryCopy: { flex: 1, marginLeft: 12 },
  summaryTitle: { color: '#18181B', fontSize: 16, fontWeight: '900' },
  summarySubtitle: { marginTop: 3, color: '#71717A', fontSize: 11 },
  sectionTitle: { marginTop: 5, color: '#18181B', fontWeight: '900' },
  sectionHeading: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formCard: {
    padding: 16,
    gap: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  calendarField: {
    minHeight: 68,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  calendarFieldCopy: { flex: 1 },
  calendarLabel: { color: '#A1A1AA', fontSize: 9, fontWeight: '900' },
  calendarValue: { marginTop: 4, color: '#18181B', fontSize: 15, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 430,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 12,
  },
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarEyebrow: {
    color: '#E11D2E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  calendarTitle: { marginTop: 3, color: '#18181B', fontWeight: '900' },
  monthControls: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDates: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
  },
  selectedDateText: { color: '#9F1239', fontSize: 10, fontWeight: '800' },
  weekRow: { marginTop: 12, flexDirection: 'row' },
  weekday: {
    width: '14.2857%',
    color: '#A1A1AA',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  daysGrid: { marginTop: 7, flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  dayInRange: { borderRadius: 0, backgroundColor: '#FFE4E6' },
  selectedDay: { borderRadius: 999, backgroundColor: '#E11D2E' },
  dayText: { color: '#27272A', fontSize: 13, fontWeight: '700' },
  disabledDayText: { color: '#D4D4D8' },
  selectedDayText: { color: '#FFFFFF', fontWeight: '900' },
  calendarHint: {
    marginTop: 12,
    color: '#71717A',
    textAlign: 'center',
    fontSize: 11,
  },
  dateSummary: {
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: '#E4E4E7',
  },
  dateLabel: { color: '#A1A1AA', fontSize: 9, fontWeight: '900' },
  dateValue: { marginTop: 3, color: '#18181B', fontSize: 13, fontWeight: '800' },
  totalCard: {
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  totalLabel: { color: '#A1A1AA', fontSize: 9, fontWeight: '900' },
  totalAmount: {
    marginTop: 4,
    color: '#18181B',
    fontSize: 28,
    fontWeight: '900',
  },
  nightsText: { color: '#71717A', fontSize: 11 },
  secureBadge: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  secureText: { marginTop: 2, color: '#15803D', fontSize: 9, fontWeight: '900' },
  paymentCard: { padding: 16, gap: 10, borderRadius: 18, backgroundColor: '#FFFFFF' },
  paymentHeading: { color: '#18181B', fontSize: 16, fontWeight: '900' },
  paymentOption: {
    minHeight: 70,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 13,
  },
  paymentOptionSelected: { borderColor: '#E11D2E', backgroundColor: '#FFF1F2' },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: '#18181B', fontSize: 14, fontWeight: '800' },
  paymentSubtitle: { marginTop: 2, color: '#71717A', fontSize: 10 },
  checkoutScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  checkoutHeader: {
    minHeight: 58,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  checkoutTitle: { color: '#18181B', fontSize: 16, fontWeight: '900' },
  confirmButton: { height: 54 },
  darkScreen: { backgroundColor: '#09090B' },
  darkCard: { backgroundColor: '#18181B' },
  darkInput: { backgroundColor: '#27272A' },
  darkPrimaryText: { color: '#FFFFFF' },
});
