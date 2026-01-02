// scripts/ensureSchema.js
const { query } = require('../config/database');

async function tableExists(tableName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
      LIMIT 1
    `,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function getColumnType(tableName, columnName) {
  const rows = await query(
    `
      SELECT COLUMN_TYPE
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows[0]?.COLUMN_TYPE || null;
}

function enumContains(typeString, value) {
  if (!typeString) return false;
  const lower = String(typeString).toLowerCase();
  return lower.includes(`'${String(value).toLowerCase()}'`);
}

async function ensureTicketsSchema() {
  if (!(await tableExists('tickets'))) return;

  // Add missing columns for older schemas.
  if (!(await columnExists('tickets', 'booking_reference'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `booking_reference` VARCHAR(50) NULL');
    await query(
      "UPDATE `tickets` SET booking_reference = CONCAT('BK', LPAD(id, 8, '0')) WHERE booking_reference IS NULL"
    );
    await query('CREATE INDEX `idx_booking_reference` ON `tickets` (`booking_reference`)');
  }

  if (!(await columnExists('tickets', 'passenger_email'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `passenger_email` VARCHAR(255) NULL');
  }

  if (!(await columnExists('tickets', 'passenger_age'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `passenger_age` INT NULL');
  }

  if (!(await columnExists('tickets', 'payment_id'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `payment_id` VARCHAR(100) NULL');
    await query('CREATE INDEX `idx_payment_id` ON `tickets` (`payment_id`)');
  }

  if (!(await columnExists('tickets', 'payment_method'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `payment_method` VARCHAR(50) NULL');
  }

  if (!(await columnExists('tickets', 'ticket_status'))) {
    await query(
      "ALTER TABLE `tickets` ADD COLUMN `ticket_status` ENUM('booked','confirmed','on_board','completed','cancelled') DEFAULT 'booked'"
    );
  }

  if (!(await columnExists('tickets', 'qr_code'))) {
    await query('ALTER TABLE `tickets` ADD COLUMN `qr_code` LONGTEXT NULL');
  }

  // Ensure payment_status enum supports both legacy ('paid') and newer ('completed').
  if (await columnExists('tickets', 'payment_status')) {
    const type = await getColumnType('tickets', 'payment_status');
    const hasCompleted = enumContains(type, 'completed');
    const hasPaid = enumContains(type, 'paid');

    if (!hasCompleted || !hasPaid) {
      // Keep both values for maximum compatibility.
      await query(
        "ALTER TABLE `tickets` MODIFY COLUMN `payment_status` ENUM('pending','paid','completed','failed','refunded') DEFAULT 'pending'"
      );
    }

    // Normalize any legacy paid -> completed if completed exists.
    await query("UPDATE `tickets` SET payment_status = 'completed' WHERE payment_status = 'paid'");
  }

  // Backfill ticket_status from legacy status column if present.
  if (await columnExists('tickets', 'status')) {
    await query(`
      UPDATE tickets
      SET ticket_status = CASE
        WHEN status = 'Pending' THEN 'booked'
        WHEN status = 'Accepted' THEN 'confirmed'
        WHEN status = 'On Board' THEN 'on_board'
        WHEN status = 'Completed' THEN 'completed'
        WHEN status = 'Cancelled' THEN 'cancelled'
        WHEN status = 'Rejected' THEN 'cancelled'
        ELSE 'booked'
      END
      WHERE ticket_status IS NULL OR ticket_status = ''
    `);
  }
}

async function ensureSubscriptionPlansSchema() {
  if (!(await tableExists('subscription_plans'))) {
    await query(`
      CREATE TABLE IF NOT EXISTS \`subscription_plans\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0,
        \`duration_days\` INT NOT NULL DEFAULT 30,
        \`bus_limit\` INT NOT NULL DEFAULT 3,
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created subscription_plans table');
  } else {
    // Add missing columns
    if (!(await columnExists('subscription_plans', 'description'))) {
      await query('ALTER TABLE `subscription_plans` ADD COLUMN `description` TEXT');
    }
    if (!(await columnExists('subscription_plans', 'bus_limit'))) {
      await query('ALTER TABLE `subscription_plans` ADD COLUMN `bus_limit` INT NOT NULL DEFAULT 3');
    }
  }
}

async function ensureCompanySubscriptionsSchema() {
  if (!(await tableExists('company_subscriptions'))) {
    await query(`
      CREATE TABLE IF NOT EXISTS \`company_subscriptions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`company_id\` INT NOT NULL,
        \`plan_id\` INT NOT NULL,
        \`start_date\` TIMESTAMP NOT NULL,
        \`end_date\` TIMESTAMP NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`plan_id\`) REFERENCES \`subscription_plans\`(\`id\`) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created company_subscriptions table');
  }
}

async function ensurePaymentsSchema() {
  if (!(await tableExists('payments'))) {
    await query(`
      CREATE TABLE IF NOT EXISTS \`payments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT,
        \`company_id\` INT,
        \`ticket_id\` INT,
        \`subscription_id\` INT,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`payment_method\` VARCHAR(255) NOT NULL DEFAULT 'MTN MoMo',
        \`transaction_ref\` VARCHAR(255) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'completed',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`subscription_id\`) REFERENCES \`company_subscriptions\`(\`id\`) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created payments table');
  } else {
    // Add missing columns
    if (!(await columnExists('payments', 'transaction_ref'))) {
      await query('ALTER TABLE `payments` ADD COLUMN `transaction_ref` VARCHAR(255) NOT NULL DEFAULT ""');
    }
    if (!(await columnExists('payments', 'payment_type'))) {
      await query('ALTER TABLE `payments` ADD COLUMN `payment_type` VARCHAR(50) DEFAULT "Ticket"');
    }
  }
}

async function ensureCarsSchema() {
  if (await tableExists('cars')) {
    // Add missing columns for cars table
    if (!(await columnExists('cars', 'name'))) {
      await query('ALTER TABLE `cars` ADD COLUMN `name` VARCHAR(255)');
    }
    if (!(await columnExists('cars', 'type'))) {
      await query('ALTER TABLE `cars` ADD COLUMN `type` VARCHAR(255) DEFAULT "Standard"');
    }
    if (!(await columnExists('cars', 'park'))) {
      await query('ALTER TABLE `cars` ADD COLUMN `park` VARCHAR(255)');
    }
    if (!(await columnExists('cars', 'total_seats'))) {
      await query('ALTER TABLE `cars` ADD COLUMN `total_seats` INT DEFAULT 45');
      // Copy capacity to total_seats if it exists
      if (await columnExists('cars', 'capacity')) {
        await query('UPDATE `cars` SET `total_seats` = `capacity` WHERE `total_seats` IS NULL');
      }
    }
  }
}

async function ensureDefaultSubscriptionPlans() {
  const existingPlans = await query('SELECT COUNT(*) as count FROM subscription_plans');
  if (existingPlans[0].count === 0) {
    // Create default subscription plans
    const plans = [
      {
        name: 'Free Trial',
        description: '7-day free trial for new companies',
        price: 0,
        duration_days: 7,
        bus_limit: 1,
        is_active: 1
      },
      {
        name: 'Basic',
        description: 'Basic plan for small companies',
        price: 50000,
        duration_days: 30,
        bus_limit: 3,
        is_active: 1
      },
      {
        name: 'Standard',
        description: 'Standard plan for growing companies',
        price: 100000,
        duration_days: 30,
        bus_limit: 10,
        is_active: 1
      },
      {
        name: 'Premium',
        description: 'Premium plan for large companies',
        price: 200000,
        duration_days: 30,
        bus_limit: 25,
        is_active: 1
      }
    ];

    for (const plan of plans) {
      await query(`
        INSERT INTO subscription_plans (name, description, price, duration_days, bus_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [plan.name, plan.description, plan.price, plan.duration_days, plan.bus_limit, plan.is_active]);
    }
    console.log('✓ Created default subscription plans');
  }
}

async function ensureSchema() {
  await ensureTicketsSchema();
  await ensureSubscriptionPlansSchema();
  await ensureCompanySubscriptionsSchema();
  await ensurePaymentsSchema();
  await ensureCarsSchema();
  await ensureDefaultSubscriptionPlans();
}

module.exports = {
  ensureSchema
};
