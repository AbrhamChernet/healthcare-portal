import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PatientProfile from '../models/PatientProfile.js';
import Consent from '../models/Consent.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secure_telehealth_refresh_secret_key_64chars_min!';

// Token helpers
const generateTokens = async (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  // 15-minute access token
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

  // 7-day refresh token
  const family = crypto.randomUUID();
  const rawRefreshToken = jwt.sign({ id: user._id, family }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store in DB
  await RefreshToken.create({
    token: rawRefreshToken,
    userId: user._id,
    family,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

// Set refresh cookie
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, name, role, doctorDetails, patientDetails } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = ['DOCTOR', 'ADMIN'].includes(role) ? role : 'PATIENT';

    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role: assignedRole
    });

    await user.save();

    // Create respective profile
    if (assignedRole === 'DOCTOR') {
      await DoctorProfile.create({
        userId: user._id,
        specialization: doctorDetails?.specialization || 'General Practice',
        licenseNumber: doctorDetails?.licenseNumber || 'LIC-' + Math.floor(100000 + Math.random() * 900000),
        licenseStateOrCountry: doctorDetails?.licenseStateOrCountry || 'State Medical Board',
        verificationStatus: 'VERIFIED', // Default verified for demonstration convenience
        bio: doctorDetails?.bio || 'Certified telehealth practitioner',
        consultationFee: doctorDetails?.consultationFee || 75
      });
    } else if (assignedRole === 'PATIENT') {
      await PatientProfile.create({
        userId: user._id,
        dateOfBirth: patientDetails?.dateOfBirth,
        gender: patientDetails?.gender || 'Other',
        bloodGroup: patientDetails?.bloodGroup || 'O+',
        allergies: patientDetails?.allergies || [],
        chronicConditions: patientDetails?.chronicConditions || []
      });

      // Automatically record initial Telehealth consent
      await Consent.create({
        userId: user._id,
        consentType: 'TELEHEALTH_TREATMENT',
        version: '1.0',
        agreed: true,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent']
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.isLocked) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        error: `Account is temporarily locked due to excessive failed attempts. Try again in ${waitMinutes} minutes.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      const remaining = 5 - (user.loginAttempts + 1);
      return res.status(401).json({
        error: 'Invalid email or password.',
        attemptsRemaining: remaining > 0 ? remaining : 0
      });
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return res.status(200).json({
          mfaRequired: true,
          userId: user._id,
          message: 'MFA TOTP code required'
        });
      }

      const isValidMfa = authenticator.verify({
        token: mfaToken,
        secret: user.mfaSecret
      });

      if (!isValidMfa) {
        return res.status(401).json({ error: 'Invalid 2FA authentication code.' });
      }
    }

    // Reset failed counter
    await user.resetLoginAttempts();

    const { accessToken, refreshToken } = await generateTokens(user);
    setRefreshCookie(res, refreshToken);

    // Fetch profile details
    let profile = null;
    if (user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'PATIENT') {
      profile = await PatientProfile.findOne({ userId: user._id });
    }

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: rawRefreshToken });
    if (!tokenDoc) {
      // Possible reuse detection: invalidate entire family
      await RefreshToken.updateMany({ family: decoded.family }, { $set: { isRevoked: true } });
      return res.status(403).json({ error: 'Compromised token detected. All sessions revoked.' });
    }

    if (tokenDoc.isRevoked) {
      return res.status(403).json({ error: 'Revoked refresh token.' });
    }

    // Mark current token as revoked
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // Generate new tokens (same family for tracking)
    const payload = { id: user._id, email: user.email, role: user.role, name: user.name };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: user._id, family: decoded.family }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await RefreshToken.create({
      token: newRefreshToken,
      userId: user._id,
      family: decoded.family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed.' });
  }
};

export const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (rawRefreshToken) {
      await RefreshToken.findOneAndUpdate({ token: rawRefreshToken }, { isRevoked: true });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Successfully logged out.' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed: ' + error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ userId: req.user._id });
    } else if (req.user.role === 'PATIENT') {
      profile = await PatientProfile.findOne({ userId: req.user._id });
    }

    const consents = await Consent.find({ userId: req.user._id });

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        mfaEnabled: req.user.mfaEnabled,
        lastActive: req.user.lastActive,
        profile,
        consents
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};

export const setupMFA = async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'TeleHealthHub', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    // Temporarily save secret
    await User.findByIdAndUpdate(req.user._id, { mfaSecret: secret });

    res.json({
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR code with Google Authenticator or Authy, then verify with a code.'
    });
  } catch (error) {
    res.status(500).json({ error: 'MFA setup failed: ' + error.message });
  }
};

export const verifyAndEnableMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.mfaSecret) {
      return res.status(400).json({ error: 'MFA setup was not initiated.' });
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    user.mfaEnabled = true;
    await user.save();

    res.json({ message: 'Two-factor authentication successfully enabled.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable MFA: ' + error.message });
  }
};

export const recordConsent = async (req, res) => {
  try {
    const { consentType, version } = req.body;
    const consent = await Consent.findOneAndUpdate(
      { userId: req.user._id, consentType },
      {
        agreed: true,
        version: version || '1.0',
        agreedAt: new Date(),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent']
      },
      { upsert: true, new: true }
    );
    res.json({ message: 'Consent acknowledged', consent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record consent: ' + error.message });
  }
};
