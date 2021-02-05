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

const listZoomRooms = (req, res, next) => {
    Chat.listZoomRooms(req.body, res, next).catch(err => next(err))
}

const createZoomRoom = (req, res, next) => {
    Chat.createZoomRoom(req.body, res, next).catch(err => next(err))
}

const listZoomRoomLocations = (req, res, next) => {
    Chat.listRoomLocations(req.body, res, next).catch(err => next(err))
}

const createZoomUser = (req, res, next) => {
    Chat.createZoomUser(req.body, res, next).catch(err => next(err))
}

const setupZoomMeeting = (req, res, next) => {
    Chat.setupZoomMeeting(req.body, res, next).catch(err => next(err))
}

const updateZoomUserStatus = (req, res, next) => {
    Chat.updateZoomUserStatus(req.body, res, next).catch(err => next(err))
}

// routes
router.get('/fetchChats', fetchChats);
router.post('/fetchZoomSignature', generateZoomSignature)
router.post('/zoomRooms', listZoomRooms)
router.post('/createZoomRoom', createZoomRoom)
router.post('/zoomRoomLocations', listZoomRoomLocations)
router.post('/createZoomUser', createZoomUser)
router.post('/setupZoomMeeting', setupZoomMeeting)
router.post('/updateZoomUserStatus', updateZoomUserStatus)

module.exports = router;