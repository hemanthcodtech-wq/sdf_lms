import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const POLICIES_CACHE_KEY = '@sdf_cached_policies_v1';

const DEFAULT_FALLBACK_POLICIES = {
  termsAndConditions: `1. Acceptance of Terms\nBy accessing Swamy Dwija Foundation (SDF LMS), you agree to be bound by these terms, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.\n\n2. Use License\nPermission is granted to temporarily access the materials on Swamy Dwija Foundation's LMS for personal, non-commercial transitory viewing only. All course materials, video recordings, PDFs, and live lectures remain the exclusive intellectual property of Swamy Dwija Foundation.\n\n3. Course Access & Validity\nCourse access, daily live sessions, and syllabus materials are granted for the duration specified during enrollment. Account sharing is strictly prohibited.\n\n4. Code of Conduct\nStudents are expected to maintain respect and decorum during all live interactive Zoom sessions. Disruptive behavior may lead to immediate termination of access without refund.\n\n5. Contact & Support\nFor any questions regarding our terms, please contact our support desk via email or phone provided below.`,

  privacyPolicy: `1. Information We Collect\nSwamy Dwija Foundation collects your name, email address, phone number, and basic profile information solely for account authentication, course enrollment, issuing completion certificates, and sending live session reminders.\n\n2. How We Use Your Information\nYour personal data is used exclusively to provide learning services, process payments via secure gateways (Razorpay / PhonePe), and send schedule updates. We never sell, rent, or trade your personal information to third parties.\n\n3. Data Security\nWe implement robust encryption and security protocols to safeguard your personal credentials and educational records against unauthorized access.\n\n4. Third-Party Integrations\nWe use verified services such as Google Identity for authentication and Zoom for live interactive classes. These services operate under their respective security standards.\n\n5. Privacy Questions\nIf you have questions about your personal data or wish to update your records, please reach out via the contact buttons below.`,

  refundPolicy: `1. 100% Digital Delivery\nAll courses, materials, and live lectures offered on Swamy Dwija Foundation are electronic digital goods. Course access is activated immediately upon successful payment verification.\n\n2. Cancellation Window\nYou may request a full refund or course transfer up to 24 hours prior to the start of Session 1 of your batch.\n\n3. Refund Processing\nApproved refunds are credited directly to your original payment method (Credit/Debit Card, Net Banking, or UPI) within 5 to 7 working business days.\n\n4. Exceptions\nOnce a batch has commenced and access to live interactive sessions or digital curriculum has been utilized, refunds cannot be issued. However, students experiencing genuine emergencies may request a transfer to a future batch.\n\n5. Submitting a Request\nTo request a cancellation or refund, please reach out to our team via the Call or Email button below with your registered email and Order ID.`,

  contactPhone: '+91 98765 43210',
  contactEmail: 'support@sdflms.org',
};

export const policyService = {
  getPolicies: async () => {
    try {
      // 1. Return cache first if available
      const cached = await AsyncStorage.getItem(POLICIES_CACHE_KEY);
      let data = cached ? JSON.parse(cached) : DEFAULT_FALLBACK_POLICIES;

      // 2. Fetch fresh from backend
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${API_BASE_URL}/admin/settings/policies`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const json = await res.json();
        if (json?.success && json?.data) {
          data = {
            ...DEFAULT_FALLBACK_POLICIES,
            ...json.data,
          };
          await AsyncStorage.setItem(POLICIES_CACHE_KEY, JSON.stringify(data));
        }
      } catch (netErr) {
        // Fallback to cache if network is slow/offline
      }

      return data;
    } catch (e) {
      return DEFAULT_FALLBACK_POLICIES;
    }
  },
};
