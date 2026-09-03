import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { Badge } from './Badge';
import { useAuth } from '../context/AuthContext';
import { getCourseImageUrl } from '../utils/imageHelper';

export const CourseCard = ({
  course,
  onPress,
  horizontal = false,
  showProgress = false,
  progress = 0,
}) => {
  const { isInWishlist, toggleWishlist } = useAuth();
  const wishlisted = isInWishlist(course._id || course.id);

  const [imgError, setImgError] = useState(false);
  const fallbackUrl = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80';
  const rawImage = course.thumbnail || course.thumbnailUrl || course.image;
  const imageUrl = getCourseImageUrl(rawImage);

  const handleWishlistPress = (e) => {
    e.stopPropagation?.();
    toggleWishlist(course);
  };

  const formatPrice = (price) => {
    if (!price || Number(price) === 0) return 'Free';
    return `₹${Number(price).toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(course)}
      style={[
        styles.card,
        horizontal ? styles.horizontalCard : styles.verticalCard,
        shadows.md,
      ]}
    >
      {/* Thumbnail Container */}
      <View style={horizontal ? styles.horizontalImageWrap : styles.verticalImageWrap}>
        <Image
          source={{ uri: imgError ? fallbackUrl : imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
        
        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={wishlisted ? colors.error : colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Category Badge */}
        {course.category ? (
          <View style={styles.badgeWrap}>
            <Badge text={course.category} variant="primary" />
          </View>
        ) : null}
      </View>

      {/* Details Container */}
      <View style={styles.contentWrap}>
        {course.level && (
          <Text style={styles.levelText}>{course.level} • {course.durationMonths ? `${course.durationMonths} Months` : 'Self-Paced'}</Text>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>

        {/* Instructor */}
        <View style={styles.instructorRow}>
          <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.instructorText} numberOfLines={1}>
            {course.instructor || course.instructorId?.name || 'Expert Faculty'}
          </Text>
        </View>

        {/* Progress or Pricing */}
        {showProgress ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Completed</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        ) : (
          <View style={styles.priceRow}>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>{formatPrice(course.price)}</Text>
              {course.originalPrice && course.originalPrice > course.price ? (
                <Text style={styles.strikePrice}>₹{course.originalPrice}</Text>
              ) : null}
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{course.rating || '4.9'}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: 6,
  },
  verticalCard: {
    width: '100%',
  },
  horizontalCard: {
    width: 280,
    marginRight: 14,
  },
  verticalImageWrap: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  horizontalImageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeWrap: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  contentWrap: {
    padding: 14,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  instructorText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  strikePrice: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  progressContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});
