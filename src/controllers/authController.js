// libraries
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
// services and models
import { sendMail } from '../utils/sendMail.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

import path from 'node:path';
import fs from 'node:fs/promises';

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

export const refreshUserSession = async (req, res) => {
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

// Request password reset email controller
export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Якщо користувача нема — навмисно повертаємо ту саму "успішну"
  // відповідь без відправлення листа (anti user enumeration).
  if (!user) {
    return res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  }

  // Користувач є — генеруємо короткоживучий JWT і відправляємо лист
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  // 1. Формуємо шлях до шаблона
  const templatePath = path.resolve('src/templates/reset-password-email.html');
  // 2. Читаємо шаблон
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  // 3. Готуємо шаблон до заповнення
  const template = handlebars.compile(templateSource);
  // 4. Формуємо із шаблона HTML документ з динамічними даними
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  console.log('🔑 Reset token generated (length):', resetToken.length);
  console.log(resetToken);

  try {
    await sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html,
    });
  } catch (error) {
    console.error('❌ Email sending failed!');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
    return;
  }

  // Та сама "нейтральна" відповідь
  res.status(200).json({
    message: 'Password reset email sent successfully',
  });
};

// Reset password controller
export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw createHttpError(401, 'Invalid or expired token');
  }

  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.updateOne({ _id: user._id }, { password: hashedPassword });
  await Session.deleteMany({ userId: user._id });

  res.status(200).json({ message: 'Password reset successfully' });
};
