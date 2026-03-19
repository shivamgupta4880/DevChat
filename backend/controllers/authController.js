const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({ name, email, password: hashedPassword });
    await user.save();
    
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '1d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '1d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    let payload;

    if (access_token) {
      // Flow where frontend passes access_token (from useGoogleLogin implicit flow)
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile from Google');
      }
      payload = await response.json();
    } else if (credential) {
      // Flow where frontend passes idToken (from <GoogleLogin /> component)
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      return res.status(400).json({ msg: "No Google token provided" });
    }

    const { email, name, sub } = payload;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a new one with a random strong password
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = new User({ name, email, password: hashedPassword });
      await user.save();
    }
    
    // Generate our app's JWT
    const jwtPayload = { user: { id: user.id } };
    jwt.sign(
      jwtPayload, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '1d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error("Google Auth Error:", err.message);
    res.status(500).send("Google Authentication failed");
  }
};

module.exports = { register, login, googleLogin };