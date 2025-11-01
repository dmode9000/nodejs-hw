// libraries
import { Router } from 'express';

// validation schemas

// controllers
import { updateUserAvatar } from '../controllers/userController.js';
// middleware
import { upload } from '../middleware/multer.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.patch(
  '/users/me/avatar',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);

export default router;
