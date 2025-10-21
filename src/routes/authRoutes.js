// libraries
import { Router } from 'express';
import { celebrate } from 'celebrate';
// validation schemas
import {
  registerUserSchema,
  loginUserSchema,
} from '../validations/authValidation.js';
// controllers
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
} from '../controllers/authController.js';

const router = Router();

router.post('/auth/register', celebrate(registerUserSchema), registerUser);
router.post('/auth/login', celebrate(loginUserSchema), loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshUserSession);

export default router;
