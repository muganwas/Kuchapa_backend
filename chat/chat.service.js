const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Job = db.Job;
const Employee = db.Employee;
const Chat = db.Chat;
const firebase = require('firebase');
const { PushNotif } = require("../notification/notification.service");

const database = firebase.database;

const respond = async socket => {
    global.socket = await socket;
}

const storeMessage = async (params, userType) => {
    try {
        const { type, textMessage, senderId, senderName, senderImage, receiverId, receiverImage, fcm_id, receiverName, serviceName, orderId, date, time } = params;
        let msgId = database().ref('chatting').child(senderId).child(receiverId).push().key;
        let updates = {};
        let recentUpdates = {};
        let message = {
            textMessage,
            imageMessage: '',
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
            "notification_by": userType === 'client' ? "Client" : "Employee",
            "save_notification": "true",
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
    respond
};