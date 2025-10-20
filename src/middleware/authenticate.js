import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  // Extract tokens from cookies
  const { accessToken } = req.cookies;

  // Check if accessToken is present
  if (!accessToken) {
    throw createHttpError(401, 'Missing access token');
  }

  // Find session by accessToken
  const session = await Session.findOne({
    accessToken: req.cookies.accessToken,
  });

  // If session not found or invalid, throw error
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  // Check if access token is expired
  const isAccessTokenExpired =
    new Date(session.accessTokenValidUntil) < new Date();

  // If expired, throw error
  if (isAccessTokenExpired) {
    throw createHttpError(401, 'Access token expired');
  }

  // Fetch the user associated with the session
  const user = await User.findById(session.userId);

  // If user not found, throw error
  if (!user) {
    throw createHttpError(401);
  }

  // Attach user to request object
  req.user = user;

  // Proceed to next middleware or route handler
  next();
};
