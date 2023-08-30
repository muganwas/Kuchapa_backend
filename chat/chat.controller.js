const express = require('express');
const router = express.Router();
const Chat = require('./chat.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

const fetchChats = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.fetchChatMessages(req.query, res, next)
        .catch(err => next(err));
}

const generateZoomSignature = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.generateSignature(req.body, res, next).catch(err => next(err))
}

const listZoomRooms = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.listZoomRooms(req.body, res, next).catch(err => next(err))
}

const createZoomRoom = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.createZoomRoom(req.body, res, next).catch(err => next(err))
}

const listZoomRoomLocations = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.listRoomLocations(req.body, res, next).catch(err => next(err))
}

const createZoomUser = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.createZoomUser(req.body, res, next).catch(err => next(err))
}

const setupZoomMeeting = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Chat.setupZoomMeeting(req.body, res, next).catch(err => next(err))
}

const updateZoomUserStatus = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
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