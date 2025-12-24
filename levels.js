const db = require('./database');

// XP settings
const XP_MIN = 15;
const XP_MAX = 25;
const XP_COOLDOWN = 60000; // 1 minute cooldown between XP gains

module.exports = {
  // Calculate level from XP
  calculateLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
  },

  // Calculate XP needed for a specific level
  calculateXPForLevel(level) {
    return level * level * 100;
  },

  // Add XP to a user
  async addXP(guild, member) {
    try {
      // Get current user data
      const userData = await db.getUserXP(guild.id, member.id);
      
      // Check cooldown
      const now = Date.now();
      const lastXpGain = userData.last_xp_gain || 0;
      
      if (now < lastXpGain + XP_COOLDOWN) {
        return null; // User is on cooldown
      }

      const oldLevel = userData.level || 0;
      const currentXP = userData.xp || 0;

      // Add random XP
      const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
      const newXP = currentXP + xpGain;

      // Calculate new level
      const newLevel = this.calculateLevel(newXP);

      // Save to database
      await db.setUserXP(guild.id, member.id, newXP, newLevel, now);

      // Check if leveled up
      if (newLevel > oldLevel) {
        return {
          leveledUp: true,
          oldLevel: oldLevel,
          newLevel: newLevel,
          xp: newXP,
          xpGain: xpGain
        };
      }

      return {
        leveledUp: false,
        level: newLevel,
        xp: newXP,
        xpGain: xpGain
      };
    } catch (error) {
      console.error('Error adding XP:', error);
      return null;
    }
  },

  // Get user XP and level
  async getUserData(guild, userId) {
    try {
      const userData = await db.getUserXP(guild.id, userId);
      const xp = userData.xp || 0;
      const level = userData.level || 0;
      
      const currentLevelXP = this.calculateXPForLevel(level);
      const nextLevelXP = this.calculateXPForLevel(level + 1);
      const xpProgress = xp - currentLevelXP;
      const xpNeeded = nextLevelXP - currentLevelXP;

      return {
        xp: xp,
        level: level,
        xpProgress: xpProgress,
        xpNeeded: xpNeeded,
        nextLevel: level + 1
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return {
        xp: 0,
        level: 0,
        xpProgress: 0,
        xpNeeded: 100,
        nextLevel: 1
      };
    }
  },

  // Get leaderboard
  async getLeaderboard(guild, limit = 10) {
    try {
      const leaderboard = await db.getLeaderboard(guild.id, limit);
      return leaderboard.map(row => ({
        userId: row.user_id,
        xp: row.xp,
        level: row.level
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  },

  // Set a role for a specific level
  async setLevelRole(guildId, level, roleId) {
    try {
      await db.setLevelRole(guildId, level, roleId);
      return true;
    } catch (error) {
      console.error('Error setting level role:', error);
      return false;
    }
  },

  // Get role for a level
  async getLevelRole(guildId, level) {
    try {
      return await db.getLevelRole(guildId, level);
    } catch (error) {
      console.error('Error getting level role:', error);
      return null;
    }
  },

  // Remove level role
  async removeLevelRole(guildId, level) {
    try {
      await db.removeLevelRole(guildId, level);
      return true;
    } catch (error) {
      console.error('Error removing level role:', error);
      return false;
    }
  },

  // Get all level roles for a guild
  async getAllLevelRoles(guildId) {
    try {
      const roles = await db.getAllLevelRoles(guildId);
      return roles.map(row => ({
        level: row.level,
        roleId: row.role_id
      }));
    } catch (error) {
      console.error('Error getting all level roles:', error);
      return [];
    }
  },

  // Award role when user levels up
  async checkAndAwardRole(guild, member, level) {
    try {
      const roleId = await this.getLevelRole(guild.id, level);
      
      if (!roleId) return null;

      const role = guild.roles.cache.get(roleId);
      
      if (!role) {
        await this.removeLevelRole(guild.id, level); // Role no longer exists
        return null;
      }

      // Check if member already has the role
      if (member.roles.cache.has(roleId)) {
        return null;
      }

      await member.roles.add(role);
      return role;
    } catch (error) {
      console.error('Failed to award role:', error);
      return null;
    }
  }
};