const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
} = require('../controllers/userController');

router.post('/', authenticate, isAdmin, createUser);
router.get('/', authenticate, isAdmin, getUsers);
router.get('/:id', authenticate, isAdmin, getUser);
router.put('/:id', authenticate, isAdmin, updateUser);
router.delete('/:id', authenticate, isAdmin, deleteUser);

router.post('/:id/block', authenticate, isAdmin, blockUser);
router.post('/:id/unblock', authenticate, isAdmin, unblockUser);

module.exports = router;
