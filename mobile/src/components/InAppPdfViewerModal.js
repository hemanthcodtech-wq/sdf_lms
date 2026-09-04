import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../theme/colors';

export const InAppPdfViewerModal = ({
  visible,
  onClose,
  title = 'Document Preview',
  documentId = '',
  pdfUrl = '',
  onDownload,
  onShare,
}) => {
  const [loading, setLoading] = useState(true);

  if (!visible) return null;

  // Google Docs PDF embedded viewer works reliably across Android & iOS WebViews
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;

  const handleOpenExternal = async () => {
    try {
      await WebBrowser.openBrowserAsync(pdfUrl);
    } catch (e) {
      console.warn('Could not open external viewer:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            {Boolean(documentId) && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {documentId}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleOpenExternal}
            title="Open in Browser Reader"
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* In-App Document Viewer */}
        <View style={styles.viewerContainer}>
          <WebView
            source={{ uri: googleViewerUrl }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            style={styles.webview}
            scalesPageToFit={true}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Rendering document inside app...</Text>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {onDownload && (
            <TouchableOpacity
              style={[styles.bottomBtn, styles.downloadBtn]}
              onPress={onDownload}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color="#065f46" />
              <Text style={styles.downloadBtnText}>Save to Device</Text>
            </TouchableOpacity>
          )}

          {onShare && (
            <TouchableOpacity
              style={[styles.bottomBtn, styles.shareBtn]}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color="#ffffff" />
              <Text style={styles.shareBtnText}>Share Document</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  downloadBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  shareBtn: {
    backgroundColor: '#0d5c31',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
