import { Session } from '../models/session.js';
import crypto from 'crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  return Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

export const setSessionCookies = (res, session) => {
  res.cookie('accessToken', session.accessToken, {
    httpOnly: true, // Available only via HTTP
    secure: true, // Only over HTTPS
    sameSite: 'none', // Allows cross-domain requests
    maxAge: FIFTEEN_MINUTES,
  });
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true, // Available only via HTTP
    secure: true, // Only over HTTPS
    sameSite: 'none', // Allows cross-domain requests
    maxAge: ONE_DAY,
  });
  res.cookie('sessionId', session._id, {
    httpOnly: true, // Available only via HTTP
    secure: true, // Only over HTTPS
    sameSite: 'none', // Allows cross-domain requests
    maxAge: ONE_DAY,
  });
};
