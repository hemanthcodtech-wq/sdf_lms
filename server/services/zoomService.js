const axios = require('axios');

const getZoomAccessToken = async () => {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured in .env');
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
    console.error('Error fetching Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

const createZoomMeeting = async (topic, startTime, durationMinutes) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic || 'Class Meeting',
        type: 2, // Scheduled meeting
        start_time: startTime, // ISO format
        duration: durationMinutes,
        settings: {
          host_video: true,
          participant_video: false,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
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
      meetingId: response.data.id,
      password: response.data.password,
    };
  } catch (error) {
    console.error('Zoom API Error:', error.response?.data || error.message);
    
    // Graceful fallback for local development if Zoom API isn't configured
    console.log('Generating fallback mock meeting link...');
    return {
      success: false,
      joinUrl: `https://zoom.us/j/mock${Math.floor(Math.random() * 1000000000)}`,
      meetingId: `mock-${Math.floor(Math.random() * 1000000)}`,
      password: 'mockpassword',
    };
  }
};

module.exports = {
  createZoomMeeting,
};
