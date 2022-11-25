'use strict';
import admin from "firebase-admin";
const { firebase, env } = require('./vars');
admin.initializeApp({
    credential: admin.credential.cert(firebase.serviceAccount)
});
export const sentGlobalNotification = async (notification) => {
    return await admin.messaging().sendToTopic(firebase.topic, notification, {priority: 'high'});
}
export const sentPersonalNotification = async (token, title, body) => {
    const payload = {
        data: {
            title: title,
            body: body,
            sound: 'default',
            badge: '1',
        },
    };
    return await admin.messaging().sendToDevice(token, payload, {priority: 'high'});
}