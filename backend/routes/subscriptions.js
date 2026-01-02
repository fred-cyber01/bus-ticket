// routes/subscriptions.js
const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public route - get available plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// Admin route - get all plans (including inactive)
router.get('/plans/all', authenticate, isAdmin, async (req, res, next) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// Admin route - get plan by id
router.get('/plans/:planId', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { planId } = req.params;
    const plan = await subscriptionService.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// Company routes - subscribe to plan
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { companyId, planId, paymentId } = req.body;
    
    // TODO: Add authorization check - only company owner/manager can subscribe
    
    const subscription = await subscriptionService.subscribeToPlan(companyId, planId, paymentId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Check subscription status
router.get('/status/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const isActive = await subscriptionService.isSubscriptionActive(companyId);
    res.json({ success: true, data: { isActive } });
  } catch (error) {
    next(error);
  }
});

// Admin routes - plan management
router.post('/plans', authenticate, isAdmin, async (req, res, next) => {
  try {
    const planData = req.body;
    const plan = await subscriptionService.createPlan(planData);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

router.put('/plans/:planId', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { planId } = req.params;
    const planData = req.body;
    const plan = await subscriptionService.updatePlan(planId, planData);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

router.delete('/plans/:planId', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { planId } = req.params;
    await subscriptionService.deletePlan(planId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get subscription statistics
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    const stats = await subscriptionService.getSubscriptionStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
