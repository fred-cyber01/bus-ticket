const adapter = require('../adapters/supabaseAdapter');
const bcrypt = require('bcryptjs');

class UserSupabase {
  static async create(userData) {
    // userData: { user_name, email, phone, password }
    const password_hash = await bcrypt.hash(userData.password || 'changeme', 10);
    const insert = {
      user_name: userData.user_name || userData.email.split('@')[0],
      email: userData.email,
      phone: userData.phone || null,
      password: password_hash,
      full_name: userData.full_name || null
    };
    return await adapter.createUser(insert);
  }

  static async findByEmail(email) {
    return await adapter.getUserByEmail(email);
  }

  static async findById(id) {
    return await adapter.getUserById(id);
  }

  static async findByPhone(phone) {
    return await adapter.getUserByPhone(phone);
  }

  static async verifyPassword(email, plainPassword) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return await bcrypt.compare(plainPassword, user.password);
  }

  static async upsert(userData) {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    return await adapter.upsertUser(userData);
  }

  static async setResetOtp(id, otp, expiry) {
    return await adapter.setUserResetOtp(id, otp, expiry);
  }

  static async findByResetOtp(otp) {
    return await adapter.getUserByResetOtp(otp);
  }

  static async clearResetOtp(id) {
    return await adapter.clearUserResetOtp(id);
  }

  static async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    return await adapter.updateUserPassword(id, hashed);
  }
}

module.exports = UserSupabase;
