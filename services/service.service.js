const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Services = db.Services;
const Main_Category = db.Main_Category;
const Sub_Category = db.Sub_Category;

module.exports = {
    getAll,
    getAllService,
    getById,
    create,
    update,
    _delete
};

async function getAll(query) {
    const { page, limit } = query;
    var data = [];
    var count = 0;
    var totalPages = 1;

    if (page != undefined && limit != undefined) {
        count = await Services.countDocuments();
        data = await Services.find({})
            // We multiply the "limit" variables by one just to make sure we pass a number and not a string
            .limit(limit * 1)
            .skip((page - 1) * limit)
            // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
            .sort({ createdDate: -1 });
        totalPages = Math.ceil(count / limit);
    } else
        data = await Services.find();

    if (data) {
        for (var i = 0; i < data.length; i++) {
            var main_c = '';
            var sub_c = '';
            main_c = await Main_Category.find({ _id: data[i].main_category });
            sub_c = await Sub_Category.find({ _id: data[i].sub_category });
            if (main_c.length > 0 && sub_c.length > 0) {
                data[i].main_category = main_c[0].main_category;
                data[i].sub_category = sub_c[0].sub_category;
            }
        }
        return { result: true, message: 'Service Found', data, currentPage: page || 1, totalPages, };
    } else {
        return { result: false, message: 'Service Not Found' };

    }
}

async function getAllService() {
    var data = '';
    if (data = await Services.find().select('-hash')) {
        return { result: true, message: 'Service Found', data: data };
    } else {
        return { result: false, message: 'Service Not Found' };

    }
}

async function getById(id) {
    return await Services.findById(id);
}

async function create(userParam) {
    if (!userParam.main_category || !userParam.sub_category || !userParam.service_name || !userParam.image) return { result: false, message: 'Missing information' };
    // validate
    const user = new Services(userParam);
    var output = '';
    if (output = await user.save()) {
        return { result: true, message: 'Add Service Successfull', data: output };
    } else {
        return { result: false, message: 'Something went wrong' };
    }
}

async function update(body) {
    const { id, updateInfo } = body;
    const service = await Services.findById(id);

    if (!service) {
        return { result: false, message: 'Service not found' };
    }
    try {
        var data = await Services.findOneAndUpdate({ _id: id }, updateInfo, {
            new: true
        });
        return { result: true, message: 'Update Service Successfull', data };
    } catch (e) {
        return { result: false, message: e.message };
    }
}

async function _delete(id) {
    if (await Services.findById(id)) {

        if (await Services.findByIdAndRemove(id)) {
            return { result: true, message: "Service deleted Successfull" };
        } else {

            return { result: false, message: "Something went wrong" };
        }

    } else {
        return { result: false, message: "Service not Found" };
    }

}