const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => res.json({ success: true, message: 'List schedules' }));
router.get('/:id', (req, res) => res.json({ success: true, message: 'Get schedule' }));
router.post('/', authenticate, isAdmin, (req, res) => res.json({ success: true, message: 'Create schedule' }));
router.put('/:id', authenticate, isAdmin, (req, res) => res.json({ success: true, message: 'Update schedule' }));
router.delete('/:id', authenticate, isAdmin, (req, res) => res.json({ success: true, message: 'Delete schedule' }));

module.exports = router;
