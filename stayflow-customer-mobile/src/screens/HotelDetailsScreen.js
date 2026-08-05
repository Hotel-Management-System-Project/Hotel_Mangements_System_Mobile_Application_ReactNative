import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { endpoints } from '../services/api';
import { Empty, Loading, Notice } from '../components/UI';
import { useAppTheme } from '../context/ThemeContext';

const HOTEL_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85';
const ROOM_FALLBACK =
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=85';

function firstImage(record, fallback) {
  const images =
    record.imageUrls ||
    record.images ||
    record.roomImages ||
    record.hotelImages;
  const first = Array.isArray(images) ? images[0] : null;

  return (
    first?.imageUrl ||
    first?.url ||
    first ||
    record.imageUrl ||
    `${fallback}&sig=${record.roomId || record.hotelId}`
  );
}

function isRoomAvailable(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['true', '1', 'available'].includes(String(value).toLowerCase());
}

function RoomCard({ room, hotel, onBook, isDark }) {
  const available = room.dateAvailable !== false &&
    isRoomAvailable(room.availabilityStatus);
  const imageUrls = useMemo(() => {
    const records = room.roomImages || room.images || room.imageUrls || [];
    const urls = (Array.isArray(records) ? records : [])
      .map((image) => image?.imageUrl || image?.url || image)
      .filter(Boolean);

    return urls.length
      ? urls
      : [`${ROOM_FALLBACK}&sig=${room.roomId}`];
  }, [room]);
  const [imageIndex, setImageIndex] = useState(0);

  const changeImage = (direction) => {
    setImageIndex(
      (current) => (current + direction + imageUrls.length) % imageUrls.length,
    );
  };

  return (
    <View style={[styles.roomCard, isDark && styles.darkCard]}>
      <View style={styles.roomImageWrap}>
        <Image
          source={{ uri: imageUrls[imageIndex] }}
          style={styles.roomImage}
        />
        <View style={[
          styles.availableBadge,
          !available && styles.unavailableBadge,
        ]}>
          <View style={[
            styles.availableDot,
            !available && styles.unavailableDot,
          ]} />
          <Text style={[
            styles.availableText,
            !available && styles.unavailableText,
          ]}>
            {available ? 'AVAILABLE' : 'UNAVAILABLE'}
          </Text>
        </View>
        <View style={styles.roomTypeBadge}>
          <Text style={styles.roomTypeBadgeText}>
            {String(room.roomType || 'Room').toUpperCase()}
          </Text>
        </View>

        {imageUrls.length > 1 && (
          <>
            <IconButton
              icon="chevron-left"
              iconColor="#FFFFFF"
              containerColor="rgba(9,9,11,0.72)"
              size={25}
              style={[styles.imageArrow, styles.leftArrow]}
              onPress={() => changeImage(-1)}
            />
            <IconButton
              icon="chevron-right"
              iconColor="#FFFFFF"
              containerColor="rgba(9,9,11,0.72)"
              size={25}
              style={[styles.imageArrow, styles.rightArrow]}
              onPress={() => changeImage(1)}
            />
            <View style={styles.imageCounter}>
              <Icon source="image-multiple-outline" size={14} color="#18181B" />
              <Text style={styles.imageCounterText}>
                {imageIndex + 1} / {imageUrls.length}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.roomContent}>
        <View style={styles.roomTitleRow}>
          <View style={styles.roomTitleCopy}>
            <Text
              variant="titleLarge"
              style={[styles.roomName, isDark && styles.darkPrimaryText]}
            >
              Room #{room.roomNumber}
            </Text>
            <View style={styles.hotelNameRow}>
              <Icon source="office-building-marker-outline" size={17} color="#71717A" />
              <Text style={styles.hotelName}>{hotel.hotelName}</Text>
            </View>
          </View>
          <View style={styles.capacityBox}>
            <Icon source="account-group-outline" size={19} color="#E11D2E" />
            <Text style={styles.capacityText}>{room.capacity}</Text>
          </View>
        </View>

        <View style={styles.amenities}>
          {room.hasWifi !== false && (
            <Chip
              compact
              icon="wifi"
              style={[styles.amenityChip, isDark && styles.darkChip]}
            >
              Free Wi-Fi
            </Chip>
          )}
          <Chip
            compact
            icon={room.airConditioned ? "snowflake" : "fan-off"}
            style={[styles.amenityChip, isDark && styles.darkChip]}
          >
            {room.airConditioned ? "AC" : "Non-AC"}
          </Chip>
          {room.hasTv && (
            <Chip
              compact
              icon="television"
              style={[styles.amenityChip, isDark && styles.darkChip]}
            >
              TV
            </Chip>
          )}
        </View>

        <View style={[styles.roomFooter, isDark && styles.darkFooter]}>
          <View>
            <Text style={styles.priceLabel}>Price per night</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, isDark && styles.darkPrimaryText]}>
                ₹{Number(room.pricePerNight || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.perNight}> / night</Text>
            </View>
          </View>
          <Button
            mode="contained"
            buttonColor={available ? '#E11D2E' : '#A1A1AA'}
            textColor="#FFFFFF"
            contentStyle={styles.bookButtonContent}
            disabled={!available}
            onPress={onBook}
          >
            {available ? 'Book now' : 'Unavailable'}
          </Button>
        </View>
      </View>
    </View>
  );
}

export default function HotelDetailsScreen({ route, navigation }) {
  const { isDark } = useAppTheme();
  const {
    hotel,
    checkInDate = '',
    checkOutDate = '',
    rooms: selectedRooms = 1,
    adults = 2,
    children = 0,
  } = route.params;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    endpoints
      .rooms()
      .then(async (response) => {
        const records = Array.isArray(response) ? response : [];
        const hotelRooms = records.filter(
          (room) => Number(room.hotelId) === Number(hotel.hotelId),
        );

        const roomsWithImages = await Promise.all(
          hotelRooms.map(async (room) => {
            let dateAvailable = isRoomAvailable(room.availabilityStatus);
            if (dateAvailable && checkInDate && checkOutDate) {
              try {
                dateAvailable = await endpoints.roomAvailability(
                  room.roomId,
                  checkInDate,
                  checkOutDate,
                );
              } catch (error) {
                dateAvailable = false;
                setMessage(error.message);
              }
            }

            try {
              const images = await endpoints.roomImages(room.roomId);
              return {
                ...room,
                dateAvailable,
                roomImages: Array.isArray(images) ? images : [],
              };
            } catch {
              return {
                ...room,
                dateAvailable,
                roomImages: room.roomImages || [],
              };
            }
          }),
        );

        setRooms(roomsWithImages);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [hotel.hotelId, checkInDate, checkOutDate]);

  const roomTypes = useMemo(
    () => [
      'All',
      ...new Set(rooms.map((room) => room.roomType).filter(Boolean)),
    ],
    [rooms],
  );

  const visibleRooms = useMemo(
    () =>
      typeFilter === 'All'
        ? rooms
        : rooms.filter((room) => room.roomType === typeFilter),
    [rooms, typeFilter],
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />

      <FlatList
        style={[styles.list, isDark && styles.darkScreen]}
        data={visibleRooms}
        keyExtractor={(room) => String(room.roomId)}
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
              style={styles.topBar}
            >
              <View style={styles.navigationRow}>
                <IconButton
                  icon="arrow-left"
                  iconColor="#FFFFFF"
                  containerColor="rgba(255,255,255,0.16)"
                  size={22}
                  onPress={() => navigation.goBack()}
                />
                <Text style={styles.topBarTitle}>Hotel details</Text>
                <IconButton
                  icon="heart-outline"
                  iconColor="#FFFFFF"
                  containerColor="rgba(255,255,255,0.16)"
                  size={22}
                  onPress={() => {}}
                />
              </View>

              <View style={styles.hotelHeroCard}>
                <Image
                  source={{ uri: firstImage(hotel, HOTEL_FALLBACK) }}
                  style={styles.hotelHeroImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(9,9,11,0.88)']}
                  style={styles.hotelHeroOverlay}
                >
                  <View style={styles.verifiedRow}>
                    <Icon source="check-decagram" size={16} color="#FFFFFF" />
                    <Text style={styles.verifiedText}>STAYFLOW VERIFIED</Text>
                  </View>
                  <Text style={styles.hotelTitle}>{hotel.hotelName}</Text>
                  <View style={styles.locationRow}>
                    <Icon source="map-marker-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.locationText}>
                      {hotel.city}, {hotel.state}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </LinearGradient>

            <View
              style={[styles.detailsSection, isDark && styles.darkScreen]}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryCopy}>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.sectionTitle,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    Available rooms
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {visibleRooms.length} room{visibleRooms.length === 1 ? '' : 's'} ready to book
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>
                    {Number(hotel.rating || 0).toFixed(1)}
                  </Text>
                  <Icon source="star" size={14} color="#FFFFFF" />
                </View>
              </View>

              {!!hotel.description && (
                <Text style={styles.description}>{hotel.description}</Text>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {roomTypes.map((type) => (
                  <Chip
                    key={type}
                    selected={typeFilter === type}
                    showSelectedCheck={false}
                    style={[
                      styles.filterChip,
                      isDark && styles.darkChip,
                      typeFilter === type && styles.activeFilterChip,
                    ]}
                    textStyle={[
                      styles.filterText,
                      typeFilter === type && styles.activeFilterText,
                    ]}
                    onPress={() => setTypeFilter(type)}
                  >
                    {type}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <Empty
            title="No rooms available"
            subtitle="Please select another room type or check again later."
          />
        }
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            hotel={hotel}
            isDark={isDark}
            onBook={() =>
              navigation.navigate('BookRoom', {
                hotel,
                room: item,
                checkInDate,
                checkOutDate,
                selectedRooms,
                adults,
                children,
              })
            }
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
    paddingBottom: 28,
  },
  topBar: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  navigationRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  hotelHeroCard: {
    height: 240,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#18181B',
  },
  hotelHeroImage: {
    width: '100%',
    height: '100%',
  },
  hotelHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 18,
    justifyContent: 'flex-end',
  },
  verifiedRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  hotelTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },
  locationRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCopy: {
    flex: 1,
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
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#15803D',
  },
  ratingText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  description: {
    marginTop: 13,
    color: '#52525B',
    fontSize: 13,
    lineHeight: 19,
  },
  filterRow: {
    paddingTop: 15,
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
  roomCard: {
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
  roomImageWrap: {
    height: 205,
    backgroundColor: '#E4E4E7',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  availableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#16A34A',
  },
  availableText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '900',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
  },
  unavailableDot: {
    backgroundColor: '#DC2626',
  },
  unavailableText: {
    color: '#B91C1C',
  },
  roomTypeBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: 'rgba(9,9,11,0.84)',
  },
  roomTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  imageArrow: {
    position: 'absolute',
    top: '42%',
    margin: 0,
  },
  leftArrow: {
    left: 8,
  },
  rightArrow: {
    right: 8,
  },
  imageCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  imageCounterText: {
    color: '#18181B',
    fontSize: 10,
    fontWeight: '900',
  },
  roomContent: {
    padding: 16,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  roomTitleCopy: {
    flex: 1,
  },
  roomName: {
    color: '#18181B',
    fontWeight: '900',
  },
  hotelNameRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotelName: {
    color: '#71717A',
    fontSize: 13,
  },
  capacityBox: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#FFF1F2',
  },
  capacityText: {
    color: '#9F1239',
    fontWeight: '900',
  },
  amenities: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: '#F4F4F5',
  },
  roomFooter: {
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
  priceRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: '#18181B',
    fontSize: 20,
    fontWeight: '900',
  },
  perNight: {
    color: '#71717A',
    fontSize: 11,
  },
  bookButtonContent: {
    height: 44,
    paddingHorizontal: 6,
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
  darkFooter: {
    borderTopColor: '#3F3F46',
  },
  darkPrimaryText: {
    color: '#FFFFFF',
  },
});
