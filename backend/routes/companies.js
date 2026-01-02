const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  approveCompany,
  suspendCompany,
  unblockCompany,
  rejectCompany,
} = require('../controllers/companyController');

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', authenticate, isAdmin, createCompany);
router.put('/:id', authenticate, isAdmin, updateCompany);
router.delete('/:id', authenticate, isAdmin, deleteCompany);

// Admin actions
router.post('/:id/approve', authenticate, isAdmin, approveCompany);
router.post('/:id/suspend', authenticate, isAdmin, suspendCompany);
router.post('/:id/unblock', authenticate, isAdmin, unblockCompany);
router.post('/:id/reject', authenticate, isAdmin, rejectCompany);

module.exports = router;
