import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export const DeviceFrame = ({ children }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 540;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'prevent-autofill-css';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: #1e293b !important;
            transition: background-color 5000s ease-in-out 0s;
          }

          /* Constrain Razorpay Modal strictly inside Phone Frame on Desktop */
          @media (min-width: 541px) {
            .razorpay-container {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 382px !important;
              max-width: 92vw !important;
              height: 780px !important;
              max-height: 86vh !important;
              border-radius: 46px !important;
              overflow: hidden !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
              z-index: 999999 !important;
            }
            .razorpay-container iframe,
            iframe.razorpay-checkout-frame {
              width: 100% !important;
              height: 100% !important;
              border-radius: 46px !important;
              border: none !important;
            }
            .razorpay-backdrop {
              background-color: rgba(0, 0, 0, 0.6) !important;
              backdrop-filter: blur(4px) !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!isDesktopWeb) {
    return <View style={styles.fullscreen}>{children}</View>;
  }

  return (
    <View style={styles.webContainer}>
      {/* Background Decorative Ambient Glows */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.outerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered Mobile Phone Frame */}
        <View style={styles.phoneOuterWrapper}>
          {/* Outer Titanium Bezel */}
          <View style={styles.phoneBezel}>
            {/* Side Buttons Visual Accents */}
            <View style={styles.volumeUpBtn} />
            <View style={styles.volumeDownBtn} />
            <View style={styles.powerBtn} />

            {/* Inner Phone Screen Container */}
            <View style={styles.phoneScreen}>
              {/* Dedicated Top Status Bar with Time, Dynamic Island, and Status Icons */}
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>9:41</Text>
                
                {/* Dynamic Island / Notch */}
                <View style={styles.dynamicIsland}>
                  <View style={styles.cameraLens} />
                  <View style={styles.sensorDot} />
                </View>

                <View style={styles.statusIcons}>
                  <Ionicons name="cellular" size={12} color="#1e293b" />
                  <Ionicons name="wifi" size={12} color="#1e293b" />
                  <Ionicons name="battery-full" size={14} color="#1e293b" />
                </View>
              </View>

              {/* App Content with Full Vertical Scroll Support */}
              <View style={styles.appContentContainer}>
                {children}
              </View>

              {/* Bottom Home Indicator Bar Area */}
              <View style={styles.homeIndicatorContainer}>
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070b14',
    position: 'relative',
  },
  outerScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -150,
    left: '20%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(13, 92, 49, 0.25)',
    pointerEvents: 'none',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: '20%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(234, 122, 40, 0.15)',
    pointerEvents: 'none',
  },
  phoneOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  phoneBezel: {
    width: 395,
    height: 770,
    maxHeight: 'calc(100vh - 36px)',
    backgroundColor: '#1e293b',
    borderRadius: 48,
    padding: 8,
    borderWidth: 3.5,
    borderColor: '#334155',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 20,
  },
  volumeUpBtn: {
    position: 'absolute',
    left: -6,
    top: 120,
    width: 3.5,
    height: 45,
    backgroundColor: '#475569',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  volumeDownBtn: {
    position: 'absolute',
    left: -6,
    top: 175,
    width: 3.5,
    height: 45,
    backgroundColor: '#475569',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  powerBtn: {
    position: 'absolute',
    right: -6,
    top: 140,
    width: 3.5,
    height: 60,
    backgroundColor: '#475569',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  statusBar: {
    height: 38,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    zIndex: 9999,
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    width: 40,
  },
  dynamicIsland: {
    width: 96,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    gap: 4,
  },
  cameraLens: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sensorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#064e3b',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 40,
    justifyContent: 'flex-end',
  },
  appContentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  homeIndicatorContainer: {
    height: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#f8fafc',
    zIndex: 9999,
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
