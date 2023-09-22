require('dotenv')
const db = require('_helpers/db');
const chats = db.Chat;
const crypto = require('crypto');
const _ = require('lodash');
const admin = require('firebase-admin');
const userService = require('../users/user.service');
const employeeService = require('../employee/employee.service');
const { imageExists } = require('../misc/helperFunctions');

const database = admin.database;
const zoomEndpoint = process.env.ZOOM_END_POINT
const zoomAuthAccessToken = process.env.ZOOM_AUTH_ACCESS_TOKE

const storeChat = async chatObject => {
    try {
        const { sender, recipient, time } = chatObject;
        if (await chats.findOne({ sender, recipient, time }))
            return { result: false, message: "chat stored already" }
        newChats = new chats(chatObject);
        if (await newChats.save())
            return { result: true, data: newChats, message: "Chat stored successfully" };
        return { result: false, message: "Chat couldn't be stored" }

    } catch (e) {
        return { result: false, message: e.message };
    };
}

const fetchAllChatMessages = async (req, res) => {
    const { sender, userType, page = 1, limit = 10 } = req;
    let Verification = userType === 'client' ? userService.findUserById : employeeService.findUserById;
    // either or condition
    const verification = await Verification(sender);
    const { result, message } = verification;
    if (result) {
        var count = await chats.countDocuments();
        const data = await chats.find({ $or: [{ sender }, { recipient: sender }] })
            // We multiply the "limit" variables by one just to make sure we pass a number and not a string
            .limit(limit * 1)
            .skip((page - 1) * limit)
            // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
            .sort({ time: 1 });
        totalPages = Math.ceil(count / limit);
        if (data.length) return res.send({ result: true, data, message: "Chats found successfully", metadata: { totalPages, page, limit } });
        return res.send({ result: false, message: "No chats found" });
    }
    else {
        return res.send({ result, message });
    }
}

const fetchChatMessages = async (query, res) => {
    try {
        const { primary, secondary, page = 1, limit = 10 } = query;
        var nLimit = Number(limit);
        if (primary == undefined || secondary == undefined) return res.json({ result: false, message: 'Primary and secondary user ids must be provided' });
        const ref = admin.database().ref('chatting/' + primary).child(secondary);
        var limitedRef = ref.orderByKey().limitToLast(nLimit);
        if (Number(page) > 1) {
            const tempRef = ref.orderByKey().limitToLast(nLimit * (Number(page) - 1));
            const tempResp = await tempRef.once('value');
            const tempRespVal = tempResp.val();
            const tempRespValArr = Object.keys(tempRespVal);
            const start = tempRespValArr.shift();
            limitedRef = ref.orderByKey().endBefore(start).limitToLast(nLimit);
        }
        const countResp = await ref.once('value');
        const resp = await limitedRef.once('value');
        const chatCount = countResp.numChildren();
        const pages = (chatCount - ((Number(page) - 1) * nLimit)) / nLimit;
        const data = resp.val();
        const dataArray = Object.values(data);
        return res.json({ result: true, message: 'Messages fetched successfully', data: dataArray, metaData: { page, pages, limit } })
    } catch (e) {
        return res.json({ result: false, message: e.message });
    }
}

const listZoomRooms = async (req, res) => {
    const listRoomsEndpoint = zoomEndpoint + "rooms/zrlist?page_size=30&unassigned_rooms=false";
    try {
        await fetch(listRoomsEndpoint,
            {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                },
                body: JSON.stringify({
                    method: "list"
                })
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response, message: "Zoom rooms retrieved" });
            });
    } catch (e) {
        return res.send({ result: false, message: e.message });
    }
}

const listRoomLocations = async (req, res) => {
    const listRoomLocationsEndpoint = zoomEndpoint + "rooms/locations?page_size=30";
    try {
        await fetch(listRoomLocationsEndpoint,
            {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                }
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response.locations, message: "Locations retrieved" });
            });
    } catch (e) {
        return res.send({ result: false, message: e.message });
    }
}

const createZoomRoom = async (req, res) => {
    const { name } = req;
    const createRoomEndpoint = zoomEndpoint + "rooms";
    try {
        await fetch(createRoomEndpoint,
            {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                },
                body: JSON.stringify({
                    "name": name,
                    "type": "ZoomRoom",
                    "location_id": null
                })
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response });
            });
    } catch (e) {
        return res.send({ result: false, message: e.message });
    }
}

const createZoomUser = async (req, res) => {
    const { email, first_name, last_name } = req;
    const createRoomEndpoint = zoomEndpoint + "users";
    try {
        await fetch(createRoomEndpoint,
            {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                },
                body: JSON.stringify({
                    "action": "create",
                    "user_info": {
                        "email": email,
                        "type": 1,
                        "first_name": first_name,
                        "last_name": last_name
                    }
                })
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response, message: "User created" });
            });
    } catch (e) {
        return res.send({ result: true, message: e.message })
    }
}

const updateZoomUserStatus = async (req, res) => {
    const { action, userId } = req;
    const updateStatusEndpoint = `${zoomEndpoint}users/${userId}/status`
    try {
        await fetch(updateStatusEndpoint,
            {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                },
                body: JSON.stringify({
                    "action": action
                })
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response, message: "Zoom user statuses retrieved" });
            });
    } catch (e) {
        return res.send({ result: false, message: e.message });
    }

}

const setupZoomMeeting = async (req, res) => {
    const { userId } = req;
    const createMeetingEndpoint = `${zoomEndpoint}users/${userId}/meetings`;
    try {
        await fetch(createMeetingEndpoint,
            {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${zoomAuthAccessToken}`,
                    "Content-Type": "application/json",
                    "Connection": "keep-alive"
                },
                body: JSON.stringify({
                    "type": "1",
                    "duration": "120",
                    "password": "",
                })
            }).then(response => response.json()).then(response => {
                return res.send({ result: true, data: response, message: "Meeting created successfully" });
            });
    } catch (e) {
        return res.send({ result: false, message: e.message })
    }
}

const generateSignature = (req, res) => {
    const { apiKey, apiSecret, meetingNumber, role } = req;
    try {
        // Prevent time sync issue between client signature generation and zoom
        const timestamp = new Date().getTime() - 30000
        const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString(
            'base64'
        )
        const hash = crypto
            .createHmac('sha256', apiSecret)
            .update(msg)
            .digest('base64')
        const signature = Buffer.from(
            `${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`
        ).toString('base64')
        return res.send({ signature })
    } catch (e) {
        return res.send({ error: e.errorInfo.message })
    }
}

const storeMessage = async (params, userType) => {
    try {
        const { type, file, textMessage, senderId, senderName, senderImage, receiverId, receiverImage, fcm_id, receiverName, serviceName, orderId, date, time } = params;
        let msgId = database().ref('chatting').child(senderId).child(receiverId).push().key;
        let updates = {};
        let recentUpdates = {};
        const senderImageExists = await imageExists(senderImage);
        const receiverImageExists = await imageExists(receiverImage);

        let message = file ? {
            textMessage,
            imageMessage: '',
            time,
            file,
            senderId,
            senderImage,
            senderImageExists,
            senderName,
            receiverId,
            receiverName,
            receiverImage,
            receiverImageExists,
            serviceName,
            orderId,
            type,
            date,
        } : {
            textMessage,
            imageMessage: '',
            time,
            senderId,
            senderImage,
            senderImageExists,
            senderName,
            receiverId,
            receiverName,
            receiverImage,
            receiverImageExists,
            serviceName,
            orderId,
            type,
            date,
        }

        let recentMessageReceiver = file ? {
            textMessage,
            imageMessage: '',
            time,
            date,
            file,
            id: senderId,
            name: senderName,
            image: senderImage,
            imageExists: senderImageExists,
            serviceName: serviceName,
            orderId: orderId,
            type,
        } : {
            textMessage,
            imageMessage: '',
            time,
            date,
            id: senderId,
            name: senderName,
            image: senderImage,
            imageExists: senderImageExists,
            serviceName: serviceName,
            orderId: orderId,
            type,
        }

        let recentMessageSender = file ? {
            textMessage,
            imageMessage: '',
            time,
            date,
            file,
            id: receiverId,
            name: receiverName,
            image: receiverImage,
            imageExists: receiverImageExists,
            serviceName: serviceName,
            orderId: orderId,
            type,
        } : {
            textMessage,
            imageMessage: '',
            time,
            date,
            id: receiverId,
            name: receiverName,
            image: receiverImage,
            imageExists: receiverImageExists,
            serviceName: serviceName,
            orderId: orderId,
            type,
        }

        updates['chatting/' + senderId + '/' + receiverId + '/' + msgId] = message;
        updates['chatting/' + receiverId + '/' + senderId + '/' + msgId] = message;
        database().ref().update(updates)

        recentUpdates['recentMessage/' + senderId + '/' + receiverId] = recentMessageSender;
        recentUpdates['recentMessage/' + receiverId + '/' + senderId] = recentMessageReceiver;

        database().ref().update(recentUpdates)
        return { result: true, msgId, message: "Message stored but notification not sent" };
    } catch (err) {
        console.log(err);
        return { result: false, message: "Error", error: err.message };
    }
}

module.exports = {
    storeMessage,
    storeChat,
    fetchAllChatMessages,
    fetchChatMessages,
    generateSignature,
    listZoomRooms,
    createZoomRoom,
    listRoomLocations,
    createZoomUser,
    setupZoomMeeting,
    updateZoomUserStatus
};