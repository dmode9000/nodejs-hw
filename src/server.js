// src/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Імпортуємо middleware
import { errors } from 'celebrate';
import 'dotenv/config';
import { connectMongoDB } from './db/connectMongoDB.js'; // Підключення до MongoDB
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { logger } from './middleware/logger.js';
import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Global Middleware
app.use(logger); // Logger first — sees all requests
app.use(express.json()); // JSON body parsing
app.use(cookieParser()); // Cookie parsing
app.use(cors()); // Allow requests from other domains

// Маршрути нотаток
app.use(authRoutes);
app.use(notesRoutes);
app.use(userRoutes);

// Middleware 404 (після всіх маршрутів)
app.use(notFoundHandler);

// обробка помилок від celebrate (валідація)
app.use(errors());

// Middleware для обробки помилок (останнє)
app.use(errorHandler);

await connectMongoDB(); // Підключення до MongoDB перед запуском сервера

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
