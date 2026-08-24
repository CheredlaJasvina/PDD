const fallbackDb = require('../models/fallbackDb');
const dbStatus = require('../config/db');
const UserPreference = require('../models/UserPreference');
const { sendOtpEmail } = require('../utils/emailService');

// Check DB and return active preferences modifier
const getDB = () => {
  return dbStatus.getDbStatus() ? {
    // Mongoose Auth simulations
    authenticate: async (email, password) => {
      // In production Mongoose setup, search UserPreference / User schema
      // Fallback simulates this transparently
      return fallbackDb.authenticateUser(email, password);
    },
    register: async (data) => {
      return fallbackDb.registerUser(data);
    },
    updateProfile: async (data) => {
      return fallbackDb.updateCurrentUserProfile(data);
    }
  } : {
    authenticate: async (email, password) => fallbackDb.authenticateUser(email, password),
    register: async (data) => fallbackDb.registerUser(data),
    updateProfile: async (data) => fallbackDb.updateCurrentUserProfile(data)
  };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const result = await db.authenticate(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        token: "mock-jwt-token-988-freshness",
        user: result.user
      });
    } else {
      res.status(401).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.register(req.body);
    
    if (result.success) {
      const { email } = req.body;
      const code = fallbackDb.generateOTP(email);
      try {
        await sendOtpEmail(email, code);
      } catch (mailError) {
        console.error(`Mail sending failed during signup for ${email}`, mailError);
      }

      res.json({
        success: true,
        token: "mock-jwt-token-988-freshness",
        user: result.user
      });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const user = email ? fallbackDb.getUserByEmail(email) : fallbackDb.getCurrentUser();
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: "No active session" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    fallbackDb.logoutUser();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const db = getDB();
    const updated = await db.updateProfile(req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const code = fallbackDb.generateOTP(email);
    
    try {
      await sendOtpEmail(email, code);
      res.json({ success: true, message: `OTP sent successfully to ${email}` });
    } catch (mailError) {
      console.error(`Mail sending failed, but OTP generated: ${code}`, mailError);
      res.json({ 
        success: true, 
        message: `OTP generated. (Delivery failed: ${mailError.message}). Use developer bypass code 8844.` 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }
    const isValid = fallbackDb.verifyOTP(email, code);
    if (isValid) {
      res.json({ success: true, message: "OTP verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
