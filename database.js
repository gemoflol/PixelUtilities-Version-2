const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'bot.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  db.serialize(() => {
    // User XP and levels table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_xp (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        last_xp_gain INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);

    // Level roles table
    db.run(`
      CREATE TABLE IF NOT EXISTS level_roles (
        guild_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (guild_id, level)
      )
    `);

    // Log channels table
    db.run(`
      CREATE TABLE IF NOT EXISTS log_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL
      )
    `);

    // Warnings table
    db.run(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    // Bans table
    db.run(`
      CREATE TABLE IF NOT EXISTS bans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    // Mutes table
    db.run(`
      CREATE TABLE IF NOT EXISTS mutes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        duration INTEGER NOT NULL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    console.log('Database tables initialized');
  });
}

module.exports = {
  // User XP operations
  getUserXP(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM user_xp WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || { xp: 0, level: 0, last_xp_gain: 0 });
        }
      );
    });
  },

  setUserXP(guildId, userId, xp, level, lastXpGain = Date.now()) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user_xp (guild_id, user_id, xp, level, last_xp_gain)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(guild_id, user_id) 
         DO UPDATE SET xp = ?, level = ?, last_xp_gain = ?`,
        [guildId, userId, xp, level, lastXpGain, xp, level, lastXpGain],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getLeaderboard(guildId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT user_id, xp, level FROM user_xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
        [guildId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Level roles operations
  setLevelRole(guildId, level, roleId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO level_roles (guild_id, level, role_id)
         VALUES (?, ?, ?)
         ON CONFLICT(guild_id, level) 
         DO UPDATE SET role_id = ?`,
        [guildId, level, roleId, roleId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getLevelRole(guildId, level) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT role_id FROM level_roles WHERE guild_id = ? AND level = ?',
        [guildId, level],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.role_id : null);
        }
      );
    });
  },

  removeLevelRole(guildId, level) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM level_roles WHERE guild_id = ? AND level = ?',
        [guildId, level],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getAllLevelRoles(guildId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT level, role_id FROM level_roles WHERE guild_id = ? ORDER BY level ASC',
        [guildId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Log channels operations
  setLogChannel(guildId, channelId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO log_channels (guild_id, channel_id)
         VALUES (?, ?)
         ON CONFLICT(guild_id) 
         DO UPDATE SET channel_id = ?`,
        [guildId, channelId, channelId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getLogChannel(guildId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT channel_id FROM log_channels WHERE guild_id = ?',
        [guildId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.channel_id : null);
        }
      );
    });
  },

  removeLogChannel(guildId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM log_channels WHERE guild_id = ?',
        [guildId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Warnings operations
  addWarning(guildId, userId, userTag, moderatorTag, reason) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO warnings (guild_id, user_id, user_tag, moderator_tag, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [guildId, userId, userTag, moderatorTag, reason, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getWarnings(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC',
        [guildId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  clearWarnings(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM warnings WHERE guild_id = ? AND user_id = ?',
        [guildId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes); // Returns number of deleted rows
        }
      );
    });
  },

  getAllWarnings(guildId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM warnings WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?',
        [guildId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Bans operations
  addBan(guildId, userId, userTag, moderatorTag, reason) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO bans (guild_id, user_id, user_tag, moderator_tag, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [guildId, userId, userTag, moderatorTag, reason, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getBans(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM bans WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC',
        [guildId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  getAllBans(guildId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM bans WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?',
        [guildId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Mutes operations
  addMute(guildId, userId, userTag, moderatorTag, duration, reason) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO mutes (guild_id, user_id, user_tag, moderator_tag, duration, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [guildId, userId, userTag, moderatorTag, duration, reason, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getMutes(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM mutes WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC',
        [guildId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  getAllMutes(guildId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM mutes WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?',
        [guildId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
};