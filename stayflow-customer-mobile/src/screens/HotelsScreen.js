import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
  Menu,
  Searchbar,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { endpoints } from '../services/api';
import { Loading, Notice } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85';

const FILTERS = ['All', 'Top rated'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(first, second) {
  return (
    first &&
    second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function shortDate(date) {
  if (!date) return 'Choose date';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function apiDate(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  useEffect(() => {
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

  const minimumDate =
    mode === 'checkOut' && checkIn
      ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1)
      : today;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.calendarCard, isDark && styles.darkCard]}
          onPress={() => {}}
        >
          <View style={styles.calendarTitleRow}>
            <View>
              <Text style={styles.calendarEyebrow}>
                {mode === 'checkIn' ? 'SELECT CHECK-IN' : 'SELECT CHECK-OUT'}
              </Text>
              <Text
                variant="titleLarge"
                style={[
                  styles.calendarTitle,
                  isDark && styles.darkPrimaryText,
                ]}
              >
                {month.toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
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
                {shortDate(checkIn)} → {shortDate(checkOut)}
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
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {cells.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const date = new Date(year, monthIndex, day);
              const disabled = date < minimumDate;
              const selected = sameDay(date, checkIn) || sameDay(date, checkOut);
              const inRange =
                checkIn && checkOut && date > checkIn && date < checkOut;

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
                  <Text
                    style={[
                      styles.dayText,
                      isDark && styles.darkPrimaryText,
                      disabled && styles.disabledDayText,
                      selected && styles.selectedDayText,
                    ]}
                  >
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

function GuestCounter({
  label,
  subtitle,
  value,
  minimum,
  maximum,
  onChange,
  isDark,
}) {
  return (
    <View style={styles.counterRow}>
      <View style={styles.counterCopy}>
        <Text
          style={[styles.counterLabel, isDark && styles.darkPrimaryText]}
        >
          {label}
        </Text>
        <Text style={styles.counterSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.counterControls}>
        <IconButton
          icon="minus"
          size={19}
          mode="outlined"
          disabled={value <= minimum}
          onPress={() => onChange(value - 1)}
          style={styles.counterButton}
        />
        <Text
          style={[styles.counterValue, isDark && styles.darkPrimaryText]}
        >
          {value}
        </Text>
        <IconButton
          icon="plus"
          size={19}
          mode="contained"
          containerColor="#E11D2E"
          iconColor="#FFFFFF"
          disabled={value >= maximum}
          onPress={() => onChange(value + 1)}
          style={styles.counterButton}
        />
      </View>
    </View>
  );
}

function GuestPicker({
  visible,
  rooms,
  adults,
  children,
  isDark,
  setRooms,
  setAdults,
  setChildren,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.guestCard, isDark && styles.darkCard]}
          onPress={() => {}}
        >
          <View style={styles.calendarTitleRow}>
            <View>
              <Text style={styles.calendarEyebrow}>TRAVELLERS</Text>
              <Text
                variant="titleLarge"
                style={[
                  styles.calendarTitle,
                  isDark && styles.darkPrimaryText,
                ]}
              >
                Rooms and guests
              </Text>
            </View>
            <IconButton icon="close" size={21} onPress={onClose} />
          </View>

          <GuestCounter
            label="Rooms"
            subtitle="Maximum 5 rooms"
            value={rooms}
            minimum={1}
            maximum={5}
            onChange={setRooms}
            isDark={isDark}
          />
          <GuestCounter
            label="Adults"
            subtitle="Age 13 years and above"
            value={adults}
            minimum={1}
            maximum={10}
            onChange={setAdults}
            isDark={isDark}
          />
          <GuestCounter
            label="Children"
            subtitle="Age 0–12 years"
            value={children}
            minimum={0}
            maximum={6}
            onChange={setChildren}
            isDark={isDark}
          />

          <Button
            mode="contained"
            buttonColor="#E11D2E"
            textColor="#FFFFFF"
            style={styles.doneButtonWrap}
            contentStyle={styles.doneButton}
            onPress={onClose}
          >
            Done
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function hotelImage(hotel) {
  const images = hotel.imageUrls || hotel.images || hotel.hotelImages;
  const first = Array.isArray(images) ? images[0] : null;
  return (
    first?.imageUrl ||
    first?.url ||
    first ||
    hotel.imageUrl ||
    `${FALLBACK_IMAGE}&sig=${hotel.hotelId}`
  );
}

function PromoCard({ icon, title, subtitle, color, light = false }) {
  return (
    <View style={[styles.promoCard, { backgroundColor: color }]}>
      <View style={[styles.promoIcon, light && styles.lightPromoIcon]}>
        <Icon source={icon} size={22} color={light ? '#E11D2E' : '#FFFFFF'} />
      </View>
      <Text style={[styles.promoTitle, light && styles.lightPromoTitle]}>
        {title}
      </Text>
      <Text style={[styles.promoSubtitle, light && styles.lightPromoSubtitle]}>
        {subtitle}
      </Text>
    </View>
  );
}

function HotelCard({ hotel, onPress, onReviews, isDark }) {
  const rating = Number(hotel.rating || 0);
  const startingPrice =
    hotel.startingPrice || hotel.pricePerNight || hotel.minimumPrice;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.hotelCard,
        isDark && styles.darkCard,
        pressed && styles.hotelCardPressed,
      ]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: hotelImage(hotel) }} style={styles.hotelImage} />
        <View style={styles.assuredBadge}>
          <Icon source="check-decagram" size={15} color="#FFFFFF" />
          <Text style={styles.assuredText}>STAYFLOW VERIFIED</Text>
        </View>
        <IconButton
          icon="heart-outline"
          iconColor="#18181B"
          containerColor="#FFFFFF"
          size={21}
          style={styles.favoriteButton}
          onPress={() => {}}
        />
      </View>

      <View style={styles.hotelContent}>
        <View style={styles.hotelTitleRow}>
          <View style={styles.hotelTitleCopy}>
            <Text
              variant="titleLarge"
              style={[styles.hotelName, isDark && styles.darkPrimaryText]}
              numberOfLines={1}
            >
              {hotel.hotelName}
            </Text>
            <View style={styles.locationRow}>
              <Icon source="map-marker-outline" size={17} color="#71717A" />
              <Text style={styles.locationText} numberOfLines={1}>
                {hotel.city}, {hotel.state}
              </Text>
            </View>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Icon source="star" size={13} color="#FFFFFF" />
          </View>
        </View>

        {!!hotel.description && (
          <Text
            style={[styles.description, isDark && styles.darkSecondaryText]}
            numberOfLines={2}
          >
            {hotel.description}
          </Text>
        )}

        <View style={styles.amenitiesRow}>
          <Chip
            compact
            icon="wifi"
            style={[styles.amenityChip, isDark && styles.darkChip]}
          >
            Wi-Fi
          </Chip>
          <Chip
            compact
            icon="snowflake"
            style={[styles.amenityChip, isDark && styles.darkChip]}
          >
            AC
          </Chip>
          <Chip
            compact
            icon="room-service-outline"
            style={[styles.amenityChip, isDark && styles.darkChip]}
          >
            Service
          </Chip>
        </View>

        <View
          style={[styles.cardFooter, isDark && styles.darkCardFooter]}
        >
          <View>
            <Text style={styles.priceLabel}>Rooms available</Text>
            <Text
              style={[styles.priceText, isDark && styles.darkPrimaryText]}
            >
              {startingPrice ? `₹${Number(startingPrice).toLocaleString('en-IN')}` : 'View prices'}
            </Text>
          </View>
          <Button
            mode="contained"
            buttonColor="#E11D2E"
            textColor="#FFFFFF"
            contentStyle={styles.viewButtonContent}
            onPress={onPress}
          >
            View rooms
          </Button>
        </View>

        <Button
          mode="outlined"
          icon="star-outline"
          textColor="#E11D2E"
          style={styles.reviewsButton}
          contentStyle={styles.reviewsButtonContent}
          onPress={onReviews}
        >
          Reviews & ratings
        </Button>
      </View>
    </Pressable>
  );
}

export default function HotelsScreen({ navigation }) {
  const [hotels, setHotels] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [calendarMode, setCalendarMode] = useState('checkIn');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { isDark } = useAppTheme();

  useEffect(() => {
    endpoints
      .hotels()
      .then((response) => {
        const records = Array.isArray(response) ? response : [];
        setHotels(
          records.filter(
            (hotel) => String(hotel.status).toUpperCase() === 'APPROVED',
          ),
        );
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleHotels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const text =
        `${hotel.hotelName} ${hotel.city} ${hotel.state}`.toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Top rated' && Number(hotel.rating || 0) >= 4);
      const matchesCity =
        !cityFilter ||
        String(hotel.city || '').toLowerCase() === cityFilter.toLowerCase();
      const matchesState =
        !stateFilter ||
        String(hotel.state || '').toLowerCase() === stateFilter.toLowerCase();

      return matchesQuery && matchesFilter && matchesCity && matchesState;
    });
  }, [activeFilter, cityFilter, hotels, query, stateFilter]);

  const cities = useMemo(
    () =>
      [...new Set(hotels.map((hotel) => hotel.city).filter(Boolean))].sort(
        (first, second) => first.localeCompare(second),
      ),
    [hotels],
  );

  const states = useMemo(
    () =>
      [...new Set(hotels.map((hotel) => hotel.state).filter(Boolean))].sort(
        (first, second) => first.localeCompare(second),
      ),
    [hotels],
  );

  if (loading) {
    return <Loading />;
  }

  const firstName = user?.email?.split('@')[0] || 'Guest';

  const openCalendar = (mode) => {
    setCalendarMode(mode === 'checkOut' && !checkIn ? 'checkIn' : mode);
    setCalendarOpen(true);
  };

  const selectDate = (date) => {
    if (calendarMode === 'checkIn') {
      setCheckIn(date);
      if (checkOut && checkOut <= date) {
        setCheckOut(null);
      }
      setCalendarMode('checkOut');
      return;
    }

    setCheckOut(date);
    setCalendarOpen(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />

      <FlatList
        style={[styles.hotelList, isDark && styles.darkScreen]}
        data={visibleHotels}
        keyExtractor={(hotel) => String(hotel.hotelId)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isDark && styles.darkScreen,
        ]}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#7F1D1D', '#DC2626', '#FB7185']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.redHeader}
            >
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.welcomeText}>Welcome, {firstName}</Text>
                  <View style={styles.cityRow}>
                    <Icon source="map-marker" size={18} color="#FFFFFF" />
                    <Text style={styles.cityText}>Hotels near you</Text>
                    <Icon source="chevron-down" size={18} color="#FFFFFF" />
                  </View>
                </View>
                <IconButton
                  icon="bell-outline"
                  iconColor="#FFFFFF"
                  containerColor="rgba(255,255,255,0.16)"
                  size={22}
                />
              </View>

              <Text style={styles.heroTitle}>Find your perfect stay</Text>
              <Text style={styles.heroSubtitle}>
                Verified hotels, comfortable rooms and easy booking.
              </Text>

              <Searchbar
                placeholder="Search hotel, city or location"
                placeholderTextColor="#A1A1AA"
                value={query}
                onChangeText={setQuery}
                iconColor="#E11D2E"
                inputStyle={[
                  styles.searchInput,
                  isDark && styles.darkPrimaryText,
                ]}
                style={[styles.search, isDark && styles.darkCard]}
              />

              <View style={[styles.tripBar, isDark && styles.darkCard]}>
                <Pressable
                  style={styles.tripItem}
                  onPress={() => openCalendar('checkIn')}
                >
                  <Icon source="calendar-month-outline" size={21} color="#E11D2E" />
                  <View>
                    <Text style={styles.tripLabel}>CHECK-IN</Text>
                    <Text
                      style={[
                        styles.tripValue,
                        isDark && styles.darkPrimaryText,
                      ]}
                    >
                      {shortDate(checkIn)}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.tripDivider} />
                <Pressable
                  style={styles.tripItem}
                  onPress={() => openCalendar('checkOut')}
                >
                  <Icon source="calendar-check-outline" size={21} color="#E11D2E" />
                  <View>
                    <Text style={styles.tripLabel}>CHECK-OUT</Text>
                    <Text
                      style={[
                        styles.tripValue,
                        isDark && styles.darkPrimaryText,
                      ]}
                    >
                      {shortDate(checkOut)}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.tripDivider} />
                <Pressable
                  style={styles.guestItem}
                  onPress={() => setGuestOpen(true)}
                >
                  <Icon source="account-group-outline" size={21} color="#E11D2E" />
                  <View>
                    <Text style={styles.tripLabel}>GUESTS</Text>
                    <Text
                      style={[
                        styles.tripValue,
                        isDark && styles.darkPrimaryText,
                      ]}
                    >
                      {rooms} room{rooms > 1 ? 's' : ''} · {adults + children}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={[styles.body, isDark && styles.darkScreen]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promoRow}
              >
                <PromoCard
                  icon="sale"
                  title="Save more"
                  subtitle="Special prices on verified stays"
                  color="#F5A3A3"
                  light
                />
                <PromoCard
                  icon="shield-check-outline"
                  title="Book safely"
                  subtitle="Only approved properties"
                  color="#0891B2"
                />
                <PromoCard
                  icon="lightning-bolt-outline"
                  title="Quick booking"
                  subtitle="Reserve rooms in a few taps"
                  color="#9F1239"
                />
              </ScrollView>

              <View style={styles.sectionHeading}>
                <View>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.sectionTitle,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    Recommended hotels
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {visibleHotels.length} verified stays found
                  </Text>
                </View>
                <Icon source="tune-variant" size={24} color="#E11D2E" />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {FILTERS.map((filter) => (
                  <Chip
                    key={filter}
                    selected={activeFilter === filter}
                    showSelectedCheck={false}
                    textStyle={[
                      styles.filterText,
                      activeFilter === filter && styles.activeFilterText,
                    ]}
                    style={[
                      styles.filterChip,
                      isDark && styles.darkChip,
                      activeFilter === filter && styles.activeFilterChip,
                    ]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Chip>
                ))}

                <Menu
                  visible={cityMenuOpen}
                  onDismiss={() => setCityMenuOpen(false)}
                  contentStyle={[
                    styles.dropdownMenu,
                    isDark && styles.darkCard,
                  ]}
                  anchor={
                    <Chip
                      icon="city-variant-outline"
                      closeIcon="chevron-down"
                      onClose={() => setCityMenuOpen(true)}
                      onPress={() => setCityMenuOpen(true)}
                      textStyle={[
                        styles.filterText,
                        cityFilter && styles.activeFilterText,
                      ]}
                      style={[
                        styles.filterChip,
                        isDark && styles.darkChip,
                        cityFilter && styles.activeFilterChip,
                      ]}
                    >
                      {cityFilter || 'City'}
                    </Chip>
                  }
                >
                  <Menu.Item
                    title="All cities"
                    titleStyle={[
                      styles.dropdownMenuText,
                      isDark && styles.darkPrimaryText,
                    ]}
                    leadingIcon={!cityFilter ? 'check' : undefined}
                    onPress={() => {
                      setCityFilter('');
                      setCityMenuOpen(false);
                    }}
                  />
                  {cities.map((city) => (
                    <Menu.Item
                      key={city}
                      title={city}
                      titleStyle={[
                        styles.dropdownMenuText,
                        isDark && styles.darkPrimaryText,
                      ]}
                      leadingIcon={cityFilter === city ? 'check' : undefined}
                      onPress={() => {
                        setCityFilter(city);
                        setCityMenuOpen(false);
                      }}
                    />
                  ))}
                </Menu>

                <Menu
                  visible={stateMenuOpen}
                  onDismiss={() => setStateMenuOpen(false)}
                  contentStyle={[
                    styles.dropdownMenu,
                    isDark && styles.darkCard,
                  ]}
                  anchor={
                    <Chip
                      icon="map-outline"
                      closeIcon="chevron-down"
                      onClose={() => setStateMenuOpen(true)}
                      onPress={() => setStateMenuOpen(true)}
                      textStyle={[
                        styles.filterText,
                        stateFilter && styles.activeFilterText,
                      ]}
                      style={[
                        styles.filterChip,
                        isDark && styles.darkChip,
                        stateFilter && styles.activeFilterChip,
                      ]}
                    >
                      {stateFilter || 'State'}
                    </Chip>
                  }
                >
                  <Menu.Item
                    title="All states"
                    titleStyle={[
                      styles.dropdownMenuText,
                      isDark && styles.darkPrimaryText,
                    ]}
                    leadingIcon={!stateFilter ? 'check' : undefined}
                    onPress={() => {
                      setStateFilter('');
                      setStateMenuOpen(false);
                    }}
                  />
                  {states.map((state) => (
                    <Menu.Item
                      key={state}
                      title={state}
                      titleStyle={[
                        styles.dropdownMenuText,
                        isDark && styles.darkPrimaryText,
                      ]}
                      leadingIcon={stateFilter === state ? 'check' : undefined}
                      onPress={() => {
                        setStateFilter(state);
                        setStateMenuOpen(false);
                      }}
                    />
                  ))}
                </Menu>
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, isDark && styles.darkScreen]}>
            <View style={styles.emptyIcon}>
              <Icon source="office-building-marker-outline" size={30} color="#EF4444" />
            </View>
            <Text
              variant="titleLarge"
              style={[styles.emptyTitle, isDark && styles.darkPrimaryText]}
            >
              No hotels found
            </Text>
            <Text style={styles.emptySubtitle}>
              Try another hotel name, city, or filter.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <HotelCard
            hotel={item}
            isDark={isDark}
            onReviews={() =>
              navigation.navigate('HotelReviews', {
                hotelId: item.hotelId,
                hotelName: item.hotelName,
              })
            }
            onPress={() => {
              if (!checkIn || !checkOut) {
                Alert.alert(
                  'Select stay dates',
                  'Choose check-in and check-out dates to see accurate room availability.',
                );
                return;
              }

              navigation.navigate('HotelDetails', {
                hotel: item,
                checkInDate: apiDate(checkIn),
                checkOutDate: apiDate(checkOut),
                rooms,
                adults,
                children,
              });
            }}
          />
        )}
      />

      <CalendarPicker
        visible={calendarOpen}
        mode={calendarMode}
        checkIn={checkIn}
        checkOut={checkOut}
        isDark={isDark}
        onClose={() => setCalendarOpen(false)}
        onSelect={selectDate}
      />

      <GuestPicker
        visible={guestOpen}
        rooms={rooms}
        adults={adults}
        children={children}
        isDark={isDark}
        setRooms={setRooms}
        setAdults={setAdults}
        setChildren={setChildren}
        onClose={() => setGuestOpen(false)}
      />

      <Notice message={message} onDismiss={() => setMessage('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#7F1D1D',
  },
  hotelList: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 28,
    backgroundColor: '#F5F5F5',
  },
  redHeader: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 12,
    backgroundColor: '#E11D2E',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    color: '#FECACA',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cityRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  heroTitle: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 2,
    color: '#FEE2E2',
    fontSize: 12,
  },
  search: {
    marginTop: 9,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    minHeight: 42,
    fontSize: 13,
    color: '#18181B',
  },
  tripBar: {
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  tripItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  guestItem: {
    flex: 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tripDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 10,
    backgroundColor: '#E4E4E7',
  },
  tripLabel: {
    color: '#A1A1AA',
    fontSize: 8,
    fontWeight: '800',
  },
  tripValue: {
    marginTop: 1,
    color: '#18181B',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    paddingTop: 22,
    backgroundColor: '#F5F5F5',
  },
  promoRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  promoCard: {
    width: 210,
    minHeight: 122,
    padding: 16,
    borderRadius: 18,
  },
  promoIcon: {
    width: 37,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lightPromoIcon: {
    backgroundColor: '#FFE4E6',
  },
  promoTitle: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  lightPromoTitle: {
    color: '#18181B',
  },
  promoSubtitle: {
    marginTop: 3,
    color: '#F4F4F5',
    fontSize: 12,
  },
  lightPromoSubtitle: {
    color: '#71717A',
  },
  sectionHeading: {
    marginTop: 26,
    paddingHorizontal: 20,
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
  hotelCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  hotelCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  imageWrap: {
    height: 205,
    backgroundColor: '#E4E4E7',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  assuredBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  assuredText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  hotelContent: {
    padding: 16,
  },
  hotelTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  hotelTitleCopy: {
    flex: 1,
  },
  hotelName: {
    color: '#18181B',
    fontWeight: '900',
  },
  locationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    flex: 1,
    color: '#71717A',
    fontSize: 13,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    backgroundColor: '#15803D',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  description: {
    marginTop: 11,
    color: '#52525B',
    fontSize: 13,
    lineHeight: 19,
  },
  amenitiesRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: '#F4F4F5',
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  priceLabel: {
    color: '#71717A',
    fontSize: 11,
  },
  priceText: {
    marginTop: 2,
    color: '#18181B',
    fontSize: 18,
    fontWeight: '900',
  },
  viewButtonContent: {
    height: 44,
    paddingHorizontal: 5,
  },
  reviewsButton: {
    marginTop: 12,
    borderColor: '#E11D2E',
    borderRadius: 14,
  },
  reviewsButtonContent: {
    height: 46,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
  },
  dropdownMenuText: {
    color: '#18181B',
  },
  emptyState: {
    minHeight: 260,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
  },
  emptyTitle: {
    marginTop: 15,
    color: '#18181B',
    fontWeight: '900',
  },
  emptySubtitle: {
    marginTop: 5,
    color: '#71717A',
    textAlign: 'center',
  },
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
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
  calendarTitle: {
    marginTop: 3,
    color: '#18181B',
    fontWeight: '900',
  },
  monthControls: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDates: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
  },
  selectedDateText: {
    color: '#9F1239',
    fontSize: 12,
    fontWeight: '800',
  },
  weekRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  weekday: {
    width: '14.2857%',
    color: '#A1A1AA',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  daysGrid: {
    marginTop: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  dayInRange: {
    borderRadius: 0,
    backgroundColor: '#FFE4E6',
  },
  selectedDay: {
    borderRadius: 999,
    backgroundColor: '#E11D2E',
  },
  dayText: {
    color: '#27272A',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledDayText: {
    color: '#D4D4D8',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  calendarHint: {
    marginTop: 12,
    color: '#71717A',
    textAlign: 'center',
    fontSize: 11,
  },
  guestCard: {
    width: '100%',
    maxWidth: 430,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
  },
  counterRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  counterCopy: {
    flex: 1,
    paddingRight: 10,
  },
  counterLabel: {
    color: '#18181B',
    fontSize: 16,
    fontWeight: '800',
  },
  counterSubtitle: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 11,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterButton: {
    margin: 0,
  },
  counterValue: {
    width: 28,
    color: '#18181B',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  doneButton: {
    height: 50,
  },
  doneButtonWrap: {
    marginTop: 18,
  },
  darkScreen: {
    backgroundColor: '#09090B',
  },
  darkCard: {
    backgroundColor: '#18181B',
  },
  darkChip: {
    borderColor: '#3F3F46',
    backgroundColor: '#27272A',
  },
  darkPrimaryText: {
    color: '#FFFFFF',
  },
  darkSecondaryText: {
    color: '#D4D4D8',
  },
  darkCardFooter: {
    borderTopColor: '#3F3F46',
  },
});
