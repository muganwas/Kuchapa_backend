require('dotenv')
const db = require('_helpers/db');
const chats = db.Chat;
const crypto = require('crypto');
const _ = require('lodash');
const firebase = require('firebase');
const { generatePassword } = require('../misc/helperFunctions')
const userService = require('../users/user.service');
const employeeService = require('../employee/employee.service');
const { PushNotif } = require("../notification/notification.service");
const { random } = require('lodash');

const database = firebase.database;
const zoomEndpoint = process.env.ZOOM_END_POINT
const zoomAPIkey = process.env.ZOOM_JWT_API_KEY
const zoomSecret = process.env.ZOOM_JWT_SECRET
const zoomAuthAccessToken = process.env.ZOOM_AUTH_ACCESS_TOKE

const storeChat = async chatObject => {
    const { sender, recipient, time, fcm_id, userType, orderId, senderName } = chatObject;
    await chats.findOne({ sender, recipient, time }, (err, data) => {
        if (err) return err;
        else if (data) return "chat stored already";
        else {
            newChats = new chats(chatObject);
            newChats.save((err, details) => {
                if (err) return err;
                else return ({ saved: true, details });
            });
            const notification = JSON.stringify({
                "fcm_id": fcm_id,
                "type": "Message",
                "user_id": userType.toLowerCase() === 'client' ? sender : recipient,
                "employee_id": userType.toLowerCase() === 'client' ? recipient : sender,
                "order_id": orderId,
                "notification_by": userType.toLowerCase() === 'client' ? "Customer" : "Employee",
                "save_notification": true,
                "title": "Message Recieved",
                "body": senderName + "has sent you a message!",
            });
            PushNotif(notification);
        }
    }).catch(e => {
        return e;
    });
    return 'huh!';
}

const fetchChatMessages = async (req, res) => {
    const { sender, userType } = req;
    let Verification = userType === 'client' ? userService.findUserById : employeeService.findUserById;
    // either or condition
    await Verification(sender).then(verification => {
        const { result, message } = verification;
        if (result) {
            chats.find({ $or: [{ sender }, { recipient: sender }] }, (err, result) => {
                if (err) res.send(err);
                res.json(result);
            });
        }
        else {
            res.send({ message });
        }
    }).catch(e => {

        res.send({ error: e.errorInfo.message });
    });
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
                res.send(response)
            }).catch(e => {
                res.send({ error: e.message });
            })
    } catch (e) {
        res.send({ error: e.message });
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
                res.send(response.locations);
            }).catch(e => {
                res.send({ error: e.message });
            })
    } catch (e) {
        res.send({ error: e.message });
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
                res.send(response)
            }).catch(e => {
                res.send({ error: e.message })
            })
    } catch (e) {
        res.send({ error: e.message })
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
                res.send(response)
            }).catch(e => {
                res.send({ error: e.message })
            })
    } catch (e) {
        res.send({ error: e.message })
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
                res.send(response)
            }).catch(e => {
                res.send({ error: e.message })
            })
    } catch (e) {
        res.send({ error: e.message })
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
            }).then(response => {
                console.log('initial response ', response)
                return response.json()
            }).then(response => {
                res.send(response)
            }).catch(e => {
                console.log('new meeting error', e)
                res.send({ error: e.message })
            })
    } catch (e) {
        res.send({ error: e.message })
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
        res.send({ signature })
    } catch (e) {
        res.send({ error: e.errorInfo.message })
    }
}

const storeMessage = async (params, userType) => {
    try {
        const { type, file, textMessage, senderId, senderName, senderImage, receiverId, receiverImage, fcm_id, receiverName, serviceName, orderId, date, time } = params;
        let msgId = database().ref('chatting').child(senderId).child(receiverId).push().key;
        let updates = {};
        let recentUpdates = {};
        let message = {
            textMessage,
            imageMessage: '',
            file,
            time,
            senderId: senderId,
            senderImage: senderImage,
            senderName: senderName,
            receiverId: receiverId,
            receiverName: receiverName,
            receiverImage: receiverImage,
            serviceName: serviceName,
            orderId: orderId,
            type,
            date,
        }
        let recentMessageReceiver = {
            textMessage,
            imageMessage: '',
            file,
            time,
            date,
            id: senderId,
            name: senderName,
            image: senderImage,
            serviceName: serviceName,
            orderId: orderId,
            type,
        }
        let recentMessageSender = {
            textMessage,
            imageMessage: '',
            file,
            time,
            date,
            id: receiverId,
            name: receiverName,
            image: receiverImage,
            serviceName: serviceName,
            orderId: orderId,
            type,
        }
        updates['chatting/' + senderId + '/' + receiverId + '/' + msgId] = message;
        updates['chatting/' + receiverId + '/' + senderId + '/' + msgId] = message;
        database().ref().update(updates);

        recentUpdates['recentMessage/' + senderId + '/' + receiverId] = recentMessageSender;
        recentUpdates['recentMessage/' + receiverId + '/' + senderId] = recentMessageReceiver;

        database().ref().update(recentUpdates);

        const notification = JSON.stringify({
            "fcm_id": fcm_id,
            "type": "Message",
            "user_id": userType === 'client' ? senderId : receiverId,
            "employee_id": userType === 'client' ? receiverId : senderId,
            "order_id": orderId,
            "notification_by": userType === 'client' ? "Customer" : "Employee",
            "save_notification": true,
            "title": "Message Recieved",
            "body": senderName + "has sent you a message!",
        });
        PushNotif(notification);
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    storeMessage,
    storeChat,
    fetchChatMessages,
    generateSignature,
    listZoomRooms,
    createZoomRoom,
    listRoomLocations,
    createZoomUser,
    setupZoomMeeting,
    updateZoomUserStatus
};