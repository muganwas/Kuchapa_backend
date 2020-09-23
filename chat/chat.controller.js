const express = require('express');
const router = express.Router();
const Chat = require('./chat.service');

const fetchChats = (req, res, next) => {
    Chat.fetchChatMessages(req.query, res, next)
        .catch(err => next(err));
}

// routes
router.get('/fetchChats', fetchChats);
module.exports = router;