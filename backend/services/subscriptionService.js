// services/subscriptionService.js
const db = require('../config/database');
const { query } = db;
const moment = require('moment-timezone');

class SubscriptionService {
  /**
   * Get all subscription plans
   */
  async getPlans() {
    return await query('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC');
  }

  /**
   * Get all subscription plans (including inactive) - Admin use
   */
  async getAllPlans() {
    return await query('SELECT * FROM subscription_plans ORDER BY price ASC');
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId) {
    const plans = await query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    return plans[0] || null;
  }

  /**
   * Start free trial for new company
   */
  async startFreeTrial(companyId, planId = null, connection = null) {
    const run = async (conn) => {
      const [planRows] = planId
        ? await conn.execute(
            'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1',
            [planId]
          )
        : await conn.execute(
            'SELECT * FROM subscription_plans WHERE name = "Free Trial" AND is_active = 1'
          );

      const plan = planRows[0];
      if (!plan) {
        throw new Error('Free trial plan not found');
      }

      const startDate = moment().tz('Africa/Kigali');
      const endDate = moment(startDate).add(plan.duration_days, 'days');
      const start = startDate.format('YYYY-MM-DD HH:mm:ss');
      const end = endDate.format('YYYY-MM-DD HH:mm:ss');

      await conn.execute(
        `
        UPDATE companies 
        SET subscription_status = 'active',
            current_plan_id = ?,
            trial_start_date = ?,
            trial_end_date = ?,
            subscription_expires_at = ?,
            bus_limit = ?
        WHERE id = ?
      `,
        [plan.id, start, end, end, plan.bus_limit, companyId]
      );

      const [subscriptionResult] = await conn.execute(
        `
        INSERT INTO company_subscriptions (
          company_id, plan_id, start_date, end_date, amount_paid, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
        [companyId, plan.id, start, end, 0, 'active']
      );

      return {
        success: true,
        plan,
        subscriptionId: subscriptionResult.insertId,
        expiresAt: end
      };
    };

    if (connection) {
      return await run(connection);
    }

    return await db.transaction(async (conn) => {
      return await run(conn);
    });
  }

  /**
   * Subscribe company to paid plan
   */
  async subscribeToPlan(companyId, planId, paymentId) {
    const plan = await this.getPlanById(planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }

    const startDate = moment().tz('Africa/Kigali');
    const endDate = moment(startDate).add(plan.duration_days, 'days');

    // Deactivate current subscription
    await query(`
      UPDATE company_subscriptions 
      SET status = 'expired' 
      WHERE company_id = ? AND status = 'active'
    `, [companyId]);

    // Create new subscription
    const result = await query(`
      INSERT INTO company_subscriptions (
        company_id, plan_id, start_date, end_date, amount_paid, payment_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      planId,
      startDate.format('YYYY-MM-DD HH:mm:ss'),
      endDate.format('YYYY-MM-DD HH:mm:ss'),
      plan.price,
      paymentId,
      'active'
    ]);

    // Update company
    await query(`
      UPDATE companies 
      SET subscription_status = 'active',
          current_plan_id = ?,
          subscription_expires_at = ?,
          bus_limit = ?
      WHERE id = ?
    `, [
      planId,
      endDate.format('YYYY-MM-DD HH:mm:ss'),
      plan.bus_limit,
      companyId
    ]);

    return {
      success: true,
      subscriptionId: result.insertId,
      expiresAt: endDate.format('YYYY-MM-DD HH:mm:ss')
    };
  }

  /**
   * Check if company subscription is active
   */
  async isSubscriptionActive(companyId) {
    const companies = await query(
      'SELECT subscription_status, subscription_expires_at FROM companies WHERE id = ?',
      [companyId]
    );
    const company = companies[0];

    if (!company) return false;

    if (company.subscription_status !== 'active') return false;

    const now = moment().tz('Africa/Kigali');
    const expiresAt = moment(company.subscription_expires_at);

    return expiresAt.isAfter(now);
  }

  /**
   * Check if company can add more buses
   */
  async canAddBus(companyId) {
    const company = (await query(
      'SELECT bus_limit FROM companies WHERE id = ?',
      [companyId]
    ))[0];

    if (!company) return false;

    const busCount = (await query(
      'SELECT COUNT(*) as count FROM cars WHERE company_id = ?',
      [companyId]
    ))[0].count;

    return busCount < company.bus_limit;
  }

  /**
   * Get company's current subscription details
   */
  async getCompanySubscription(companyId) {
    const sql = `
      SELECT 
        c.subscription_status,
        c.subscription_expires_at,
        c.bus_limit,
        cs.*,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.bus_limit as plan_bus_limit
      FROM companies c
      LEFT JOIN company_subscriptions cs ON c.id = cs.company_id AND cs.status = 'active'
      LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
      WHERE c.id = ?
    `;

    const result = await query(sql, [companyId]);
    return result[0] || null;
  }

  /**
   * Expire subscriptions (run daily via cron)
   */
  async expireSubscriptions() {
    const now = moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss');

    // Find expired subscriptions
    const expiredCompanies = await query(`
      SELECT id FROM companies 
      WHERE subscription_status = 'active' 
      AND subscription_expires_at < ?
    `, [now]);

    if (expiredCompanies.length === 0) return { expired: 0 };

    // Update company status
    await query(`
      UPDATE companies 
      SET subscription_status = 'expired'
      WHERE subscription_status = 'active' 
      AND subscription_expires_at < ?
    `, [now]);

    // Update subscription records
    await query(`
      UPDATE company_subscriptions 
      SET status = 'expired'
      WHERE status = 'active' 
      AND end_date < ?
    `, [now]);

    return { expired: expiredCompanies.length };
  }

  /**
   * Create new subscription plan (Admin only)
   */
  async createPlan(planData) {
    const { name, description, price, duration_days, bus_limit, is_active } = planData;

    const result = await query(`
      INSERT INTO subscription_plans (
        name, description, price, duration_days, bus_limit, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      description ?? '',
      price,
      duration_days,
      bus_limit,
      is_active === undefined ? 1 : (is_active ? 1 : 0)
    ]);

    return await this.getPlanById(result.insertId);
  }

  /**
   * Update subscription plan (Admin only)
   */
  async updatePlan(planId, planData) {
    const existing = await this.getPlanById(planId);
    if (!existing) {
      throw new Error('Plan not found');
    }

    const name = planData.name ?? existing.name;
    const description = planData.description ?? existing.description;
    const price = planData.price ?? existing.price;
    const duration_days = planData.duration_days ?? existing.duration_days;
    const bus_limit = planData.bus_limit ?? existing.bus_limit;
    const is_active = planData.is_active === undefined ? existing.is_active : (planData.is_active ? 1 : 0);

    await query(`
      UPDATE subscription_plans 
      SET name = ?,
          description = ?,
          price = ?,
          duration_days = ?,
          bus_limit = ?,
          is_active = ?,
          updated_at = ?
      WHERE id = ?
    `, [
      name,
      description,
      price,
      duration_days,
      bus_limit,
      is_active,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
      planId
    ]);

    return await this.getPlanById(planId);
  }

  /**
   * Deactivate subscription plan (Admin only)
   */
  async deletePlan(planId) {
    await query(`
      UPDATE subscription_plans
      SET is_active = 0,
          updated_at = ?
      WHERE id = ?
    `, [
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
      planId
    ]);

    return true;
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    const stats = {
      totalActive: (await query(
        "SELECT COUNT(*) as count FROM companies WHERE subscription_status = 'active'"
      ))[0].count,
      totalExpired: (await query(
        "SELECT COUNT(*) as count FROM companies WHERE subscription_status = 'expired'"
      ))[0].count,
      totalTrial: (await query(
        "SELECT COUNT(*) as count FROM companies WHERE subscription_status = 'active' AND current_plan_id = 1"
      ))[0].count,
      byPlan: await query(`
        SELECT sp.name, sp.price, COUNT(cs.id) as subscribers
        FROM subscription_plans sp
        LEFT JOIN company_subscriptions cs ON sp.id = cs.plan_id AND cs.status = 'active'
        WHERE sp.is_active = 1
        GROUP BY sp.id
      `),
      revenue: (await query(`
        SELECT 
          SUM(amount_paid) as total_revenue,
          COUNT(*) as total_subscriptions
        FROM company_subscriptions
        WHERE status = 'active' AND amount_paid > 0
      `))[0]
    };

    return stats;
  }
}

module.exports = new SubscriptionService();
