const db = require('_helpers/db');
const Contact = db.Contact;

module.exports = {
    create,
    _delete
};

async function create(userParam) {
    try {
        const user = new Contact(userParam);
        var data = '';
        if (data = await user.save()) {
            return { result: true, message: 'Mail Sent Successfully' };
        } else {
            return { result: false, message: 'Something went wrong' };
        }
    } catch (e) {
        return { result: false, message: e.message };
    }
}

async function _delete(id) {
    try {
        if (User.findByIdAndRemove(id)) {
            return { result: true, message: "Contact deleted" };
        }
        return { result: false, message: "Contact couldn't be found" };
    } catch (e) {
        return { result: false, message: e.message };
    }
}