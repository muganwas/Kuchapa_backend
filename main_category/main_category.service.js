const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');

const Main_Category = db.Main_Category;

module.exports = {
    getAll,
    getById,
    create,
    update,
    respond,
    _delete
};

async function respond(socket) {

    global.socket = await socket;
    var data = await Main_Category.find()
    if (data) {
        // socket.emit("ADDED_DATA",data);
    }
}

async function getAll(query) {
    const { page, limit } = query;
    var data = [];
    var count = 0;
    var totalPages = 1;

    if (page != undefined && limit != undefined) {
        count = await Main_Category.countDocuments();
        data = await Main_Category.find({})
            // We multiply the "limit" variables by one just to make sure we pass a number and not a string
            .limit(limit * 1)
            .skip((page - 1) * limit)
            // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
            .sort({ createdAt: -1 });
        totalPages = Math.ceil(count / limit);
    } else
        data = await Main_Category.find();

    if (data)
        return { result: true, message: 'Service Found', currentPage: page || 1, totalPages, data };

    return { result: false, message: 'Service Not Found' };
}

async function getById(id) {
    return await Main_Category.findById(id);
}

async function create(userParam) {
    if (!userParam.main_category) return { result: false, message: 'Missing information' };

    const cat = new Main_Category(userParam);

    var output = '';
    if (output = await cat.save()) {

        return { result: true, message: 'Add Category Successfull', data: output };
    } else {
        return { result: false, message: 'Something went wrong' };
    }
}

async function update(body) {
    const { id, updateInfo } = body;
    var category = await Main_Category.findById(id);

    // validate
    if (!category) {
        return { result: false, message: "category not found" };
    }
    console.log({ id, updateInfo });
    try {
        var data = await Main_Category.findOneAndUpdate({ _id: id }, updateInfo, {
            new: true
        });
        return { result: true, message: "update Successfull", data };
    } catch (e) {
        return { result: false, message: e.message };
    }
}

async function _delete(id) {

    console.log(id);
    if (await Main_Category.findById(id)) {

        if (await Main_Category.findByIdAndRemove(id)) {
            return { result: true, message: "Category deleted Successfull" };
        } else {

            return { result: false, message: "Something went wrong" };
        }

    } else {
        return { result: false, message: "Category not Found" };
    }
}