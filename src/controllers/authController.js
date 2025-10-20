// libraries
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
// services and models
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

// controllers
export const registerUser = async (req, res) => {
  // extract data from request body
  const { email, password, name } = req.body;

  // check if user with the given email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(400, 'Email in use');
  }

  // hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // create a new user
  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
  });

  // create a new session for the user
  const newSession = await createSession(newUser._id);

  // set session cookies in the response
  setSessionCookies(res, newSession);

  // respond with the newly created user
  res.status(201).json(newUser);
};

export const loginUser = async (req, res) => {
  // extract data from request body
  const { email, password } = req.body;

  // find the user by email
  const user = await User.findOne({ email });

  // if user not found, throw error
  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  // compare the provided password with the stored hashed password
  const isValidPassword = await bcrypt.compare(password, user.password);

  // if password is invalid, throw error
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  // delete any existing sessions for the user
  await Session.deleteOne({ userId: user._id });

  // create a new session for the user
  const newSession = await createSession(user._id);

  // set session cookies in the response
  setSessionCookies(res, newSession);

  // respond with the user data
  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  // Extract sessionId from cookies
  const { sessionId } = req.cookies;

  // Delete the session from the database
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  // Clear session cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');

  // Send no content response
  res.status(204).send();
};

export const refreshSession = async (req, res) => {
  // Find the session by ID and refresh token
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // Validate session and refresh token
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  // Check if refresh token is expired
  const isRefreshTokenExpired =
    new Date(session.refreshTokenValidUntil) < new Date();

  // If expired, throw error
  if (isRefreshTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  // Delete current session
  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // Create new session
  const newSession = await createSession(session.userId);

  // Set new cookies
  setSessionCookies(res, newSession);

  // Send success response
  res.status(200).json({ message: 'Successfully refreshed a session!' });
};
