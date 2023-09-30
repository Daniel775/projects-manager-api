import { Router } from 'express';
import * as usersController from './controllers/authController';

const router = Router();

router.post('/login', usersController.login);
router.post('/signup', usersController.signup);

export default router;
