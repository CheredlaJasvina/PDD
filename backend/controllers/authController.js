const fallbackDb = require('../models/fallbackDb');
const dbStatus = require('../config/db');
const UserPreference = require('../models/UserPreference');
const { sendOtpEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'freshradar-secret';

// Sign a JWT for the given email and name
const signToken = (email, name) => {
  return jwt.sign({ email, name }, JWT_SECRET, { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (dbStatus.getDbStatus()) {
      const User = require('../models/User');
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      // Fetch profile from UserPreference for full user object
      let pref = await UserPreference.findOne({ owner: user.email });
      if (!pref) {
        pref = await new UserPreference({ owner: user.email }).save();
      }
      const token = signToken(user.email, user.name);
      return res.json({
        success: true,
        token,
        user: {
          email: user.email,
          name: user.name,
          dietaryPreferences: pref.dietaryPreferences,
          audienceMode: pref.audienceMode,
          servings: pref.servings,
          membersCount: pref.membersCount,
          notificationPref: pref.notificationPref,
          healthScore: pref.healthScore,
          streakCount: pref.streakCount,
          unlockedBadges: pref.unlockedBadges
        }
      });
    }

    // Offline fallback
    const result = await fallbackDb.authenticateUser(email, password);
    if (result.success) {
      const token = signToken(email, result.user && result.user.name);
      return res.json({ success: true, token, user: result.user });
    }
    return res.status(401).json({ success: false, message: result.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (dbStatus.getDbStatus()) {
      const User = require('../models/User');
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await new User({ email: email.toLowerCase().trim(), password: hashed, name }).save();
      // Create default UserPreference
      let pref = await UserPreference.findOne({ owner: user.email });
      if (!pref) {
        pref = await new UserPreference({ owner: user.email }).save();
      }
      const token = signToken(user.email, user.name);
      return res.json({
        success: true,
        token,
        user: {
          email: user.email,
          name: user.name,
          dietaryPreferences: pref.dietaryPreferences,
          audienceMode: pref.audienceMode,
          servings: pref.servings,
          membersCount: pref.membersCount,
          notificationPref: pref.notificationPref,
          healthScore: pref.healthScore,
          streakCount: pref.streakCount,
          unlockedBadges: pref.unlockedBadges
        }
      });
    }

    // Offline fallback
    const result = await fallbackDb.registerUser(req.body);
    if (result.success) {
      const token = signToken(email, result.user && result.user.name);
      return res.json({ success: true, token, user: result.user });
    }
    return res.status(400).json({ success: false, message: result.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];

    if (dbStatus.getDbStatus() && email) {
      const User = require('../models/User');
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        let pref = await UserPreference.findOne({ owner: user.email });
        if (!pref) pref = await new UserPreference({ owner: user.email }).save();
        return res.json({
          success: true,
          user: {
            email: user.email,
            name: user.name,
            dietaryPreferences: pref.dietaryPreferences,
            audienceMode: pref.audienceMode,
            servings: pref.servings,
            membersCount: pref.membersCount,
            notificationPref: pref.notificationPref,
            healthScore: pref.healthScore,
            streakCount: pref.streakCount,
            unlockedBadges: pref.unlockedBadges
          }
        });
      }
    }

    // Offline fallback
    const user = email ? fallbackDb.getUserByEmail(email) : fallbackDb.getCurrentUser();
    if (user) {
      return res.json({ success: true, user });
    }
    res.json({ success: false, message: 'No active session' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    fallbackDb.logoutUser();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const email = (req.headers && req.headers['x-user-email']) || req.body.email || '';
    const { dietaryPreferences, servings, audienceMode, membersCount, notificationPref } = req.body;

    if (dbStatus.getDbStatus() && email) {
      // Upsert UserPreference with the profile fields
      await UserPreference.findOneAndUpdate(
        { owner: email },
        { dietaryPreferences, servings, audienceMode, membersCount, notificationPref },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Also update name on User document if provided
      if (req.body.name) {
        const User = require('../models/User');
        await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { name: req.body.name });
      }

      // Return merged user object
      const User = require('../models/User');
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      const pref = await UserPreference.findOne({ owner: email });
      const updatedUser = {
        email,
        name: (user && user.name) || req.body.name || '',
        dietaryPreferences: pref.dietaryPreferences,
        audienceMode: pref.audienceMode,
        servings: pref.servings,
        membersCount: pref.membersCount,
        notificationPref: pref.notificationPref,
        healthScore: pref.healthScore,
        streakCount: pref.streakCount,
        unlockedBadges: pref.unlockedBadges
      };
      return res.json({ success: true, user: updatedUser });
    }

    // Offline fallback
    if (email) {
      const existingUser = fallbackDb.getUserByEmail(email);
      if (existingUser) {
        fallbackDb.setCurrentUserByEmail(email);
      }
    }
    const updated = fallbackDb.updateCurrentUserProfile(req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const code = fallbackDb.generateOTP(email);

    try {
      await sendOtpEmail(email, code);
      res.json({ success: true, message: `OTP sent successfully to ${email}` });
    } catch (mailError) {
      console.error(`Mail sending failed, but OTP generated: ${code}`, mailError);
      res.json({
        success: true,
        message: `OTP sent to ${email}. If not received, please check your spam folder or try again.`
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
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }
    const isValid = fallbackDb.verifyOTP(email, code);
    if (isValid) {
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
