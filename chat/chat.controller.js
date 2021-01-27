const express = require('express');
const router = express.Router();
const Chat = require('./chat.service');

const fetchChats = (req, res, next) => {
    Chat.fetchChatMessages(req.query, res, next)
        .catch(err => next(err));
}

const generateZoomSignature = (req, res, next) => {
    Chat.generateSignature(req.body, res, next).catch(err => next(err))
}

// routes
router.get('/fetchChats', fetchChats);
router.post('/fetchZoomSignature', generateZoomSignature)

module.exports = router;