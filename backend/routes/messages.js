const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../model/Message');

// Get messages for a specific channel
router.get('/:channel', auth, async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.channel })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
