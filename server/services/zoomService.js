const axios = require('axios');
const crypto = require('crypto');

/**
 * Retrieve Server-to-Server OAuth Access Token from Zoom
 */
const getZoomAccessToken = async () => {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured in environment (.env)');
  }

  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(tokenUrl, {}, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('[ZoomService] Error fetching Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to obtain Zoom access token');
  }
};

/**
 * Create a live scheduled class meeting via Zoom REST API
 */
const createZoomMeeting = async (topic, startTime, durationMinutes = 60, options = {}) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic || 'SDF Live Class',
        type: 2, // Scheduled meeting
        start_time: startTime, // ISO format
        duration: durationMinutes,
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: options.autoRecording || 'cloud', // Automatic cloud recording for completed sessions
          approval_type: 2, // Automatically approve
          audio: 'both',
          meeting_authentication: false, // Students don't need Zoom accounts
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      meetingId: response.data.id.toString(),
      password: response.data.password,
      topic: response.data.topic,
      startTime: response.data.start_time,
      duration: response.data.duration
    };
  } catch (error) {
    console.error('[ZoomService] Create Meeting API Error:', error.response?.data || error.message);
    
    // Graceful fallback for local offline development
    const mockId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const mockPass = 'sdf' + Math.floor(100 + Math.random() * 900);
    return {
      success: false,
      joinUrl: `https://zoom.us/j/${mockId}?pwd=${mockPass}`,
      startUrl: `https://zoom.us/s/${mockId}?pwd=${mockPass}`,
      meetingId: mockId,
      password: mockPass,
      topic: topic || 'Live Class (Dev Fallback)',
      startTime,
      duration: durationMinutes
    };
  }
};

/**
 * Generate Meeting SDK Token / Signature for embedding Zoom directly inside LMS App / Web
 * role: 0 = attendee/student, 1 = host/teacher
 */
const generateMeetingSdkToken = ({ meetingNumber, role = 0 }) => {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      token: 'mock_sdk_token_' + Date.now(),
      clientId: 'mock_client_id'
    };
  }

  try {
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours validity

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      appKey: clientId,
      sdkKey: clientId,
      mn: meetingNumber.toString(),
      role: parseInt(role, 10),
      iat,
      exp,
      tokenExp: exp
    };

    const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const sPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(`${sHeader}.${sPayload}`)
      .digest('base64url');

    const token = `${sHeader}.${sPayload}.${signature}`;

    return {
      success: true,
      token,
      sdkKey: clientId,
      meetingNumber: meetingNumber.toString(),
      role
    };
  } catch (error) {
    console.error('[ZoomService] Error generating SDK signature:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle Zoom Webhook URL Validation challenge (endpoint.url_validation)
 */
const handleWebhookUrlValidation = (plainToken) => {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || process.env.ZOOM_CLIENT_SECRET || 'sdf_zoom_secret';
  const encryptedToken = crypto
    .createHmac('sha256', secret)
    .update(plainToken)
    .digest('hex');

  return {
    plainToken,
    encryptedToken
  };
};

module.exports = {
  getZoomAccessToken,
  createZoomMeeting,
  generateMeetingSdkToken,
  handleWebhookUrlValidation,
};
