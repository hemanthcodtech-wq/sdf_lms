import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme/colors';
import { policyService } from '../services/policyService';

/**
 * Clean any remaining markdown asterisk artifacts or bullet asterisks
 * so text displays naturally, elegantly, and without getting cut off.
 */
const formatPolicyText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold **
    .replace(/\*(.*?)\*/g, '$1')     // remove italic *
    .replace(/^(\s*)\*\s+/gm, '$1• ') // convert list bullet * to clean bullet •
    .replace(/^#+\s*/gm, '')         // remove markdown # headers
    .trim();
};

export const TermsModal = ({
  visible,
  onClose,
  onAccept,
  role = 'user', // 'user' | 'instructor' | 'moderator'
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  const getTitle = () => {
    if (role === 'instructor') return 'Instructor Terms & Conditions';
    if (role === 'moderator') return 'Moderator Terms & Conditions';
    return 'Terms & Conditions';
  };

  useEffect(() => {
    if (visible) {
      let isMounted = true;
      setLoading(true);
      policyService.getPolicies().then((policies) => {
        if (!isMounted) return;
        let text = '';
        if (role === 'instructor') {
          text = policies?.instructorTerms || policies?.termsAndConditions || '';
        } else if (role === 'moderator') {
          text = policies?.moderatorTerms || policies?.termsAndConditions || '';
        } else {
          text = policies?.termsAndConditions || '';
        }
        setContent(formatPolicyText(text));
        setLoading(false);
      }).catch(() => {
        if (isMounted) setLoading(false);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [visible, role]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {getTitle()}
                </Text>
                <Text style={styles.headerSub}>Swamy Dwija Foundation</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Terms & Conditions...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <View style={styles.documentCard}>
                <Text style={styles.bodyText}>
                  {content || 'Terms and Conditions are currently unavailable. Please check back shortly.'}
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            {onAccept && (
              <TouchableOpacity
                style={[styles.acceptBtn, shadows.sm]}
                onPress={() => {
                  onAccept();
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.acceptBtnText}>I Agree & Understand</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: Platform.OS === 'web' ? '88%' : '90%',
    height: '88%',
    display: 'flex',
    flexDirection: 'column',
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 23,
    color: '#334155',
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
