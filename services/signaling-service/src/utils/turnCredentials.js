import crypto from 'crypto';

export const generateTurnCredentials = (userId) => {
  const secret = process.env.COTURN_SECRET || 'coturn_shared_turn_secret_for_time_limited_credentials';
  const turnUrl = process.env.TURN_SERVER_URL || 'turn:turn.telehealthhub.internal:3478';

  // 12-hour validity
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (12 * 3600);
  const username = `${expiryTimestamp}:${userId}`;

  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(username);
  const password = hmac.digest('base64');

  return {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302'
        ]
      },
      {
        urls: [turnUrl],
        username,
        credential: password
      }
    ],
    expiresAt: new Date(expiryTimestamp * 1000).toISOString()
  };
};
