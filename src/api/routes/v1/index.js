import * as path from "path";
import express from "express";
import userRoutes from "./user.route";
import authRoutes from "./auth.route";
const router = express.Router();
/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));
/**
 * GET v1/docs
 */
router.use('/docs', express.static(path.join(__dirname, '../../../public/doc/index.html')));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
module.exports = router;