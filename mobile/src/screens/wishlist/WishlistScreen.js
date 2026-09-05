import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { CourseCard } from '../../components/CourseCard';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const WishlistScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { wishlist } = useAuth();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>{t('wishlist')}</Text>
        <Text style={styles.headerSubtitle}>
          {wishlist.length} {wishlist.length === 1 ? t('courseSaved') : t('coursesSaved')}
        </Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item, index) => item._id || item.id || String(index)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title={t('wishlistEmptyTitle')}
            description={t('wishlistEmptyDesc')}
            buttonTitle={t('exploreCourses')}
            onButtonPress={() => navigation.navigate('CoursesTab')}
          />
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={(course) =>
              navigation.navigate('CourseDetails', {
                slug: course.slug || course._id,
                course,
              })
            }
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
});
