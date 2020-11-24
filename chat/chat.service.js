const db = require('_helpers/db');
const chats = db.Chat;
const firebase = require('firebase');
const userService = require('../users/user.service');
const employeeService = require('../employee/employee.service');
const { PushNotif } = require("../notification/notification.service");

const database = firebase.database;

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
    console.log('usertype', userType)
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
        console.log('verification error', e.errorInfo.message);
        res.send({ error: e.errorInfo.message });
    });
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
    fetchChatMessages
};