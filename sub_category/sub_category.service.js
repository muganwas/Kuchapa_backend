const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Sub_Category = db.Sub_Category;
const Main_category = db.Main_Category;

module.exports = {
    getAll,
    getById,
    getByMId,
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
        count = await Sub_Category.countDocuments();
        data = await Sub_Category.find({})
            // We multiply the "limit" variables by one just to make sure we pass a number and not a string
            .limit(limit * 1)
            .skip((page - 1) * limit)
            // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
            .sort({ createdAt: -1 });
        totalPages = Math.ceil(count / limit);
    } else
        data = await Sub_Category.find();
    if (data) {
        for (var i = 0; i < data.length; i++) {
            try {
                var m_cat = '';
                m_cat = await Main_category.findById(data[i].main_category);
                if (m_cat) {
                    data[i].main_category = m_cat.main_category;
                }
            } catch (e) {
                console.log(e.message);
            }
        }
        return { result: true, message: 'Service Found', data: data };
    } else {
        return { result: false, message: 'Service Not Found' };

    }
}

async function getById(id) {
    return await Sub_Category.findById(id);
}
async function getByMId(id) {
    var data = '';
    if (data = await Sub_Category.find({ main_category: id })) {
        return { result: true, message: 'Sub Category Found', data: data };
    } else {
        return { result: false, message: 'Sub Category Not Found' };
    }

}

async function create(userParam) {
    if (!userParam.main_category || !userParam.sub_category) return { result: false, message: 'Missing information' };

    const cat = new Sub_Category(userParam);

    var output = '';
    if (output = await cat.save()) {
        return { result: true, message: 'Add Category Successfull', data: output };
    } else {
        return { result: false, message: 'Something went wrong' };
    }
}

async function update(id, userParam) {
    const user = await Sub_Category.findById(id);

    // validate
    if (!user) {
        return { result: false, message: "user not found" };
    }


    // copy userParam properties to user
    Object.assign(user, userParam);
    var data = '';
    if (data = await user.save()) {
        return { result: true, message: "update Successfull", data: data };

    } else {
        return { result: false, message: "Something went wrong" };

    }

}

async function _delete(id) {

    if (await Sub_Category.findById(id)) {

        if (await Sub_Category.findByIdAndRemove(id)) {
            return { result: true, message: "Category deleted Successfull" };
        } else {

            return { result: false, message: "Something went wrong" };
        }

    } else {
        return { result: false, message: "Category not Found" };
    }
}


