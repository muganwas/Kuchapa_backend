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
    const { page = 1, limit = 10 } = query;
    var data = [];
    var count = 0;
    var totalPages = 1;
    count = await Main_Category.countDocuments();
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    data = await Main_Category.find({})
        // We multiply the "limit" variables by one just to make sure we pass a number and not a string
        .limit(numLimit)
        .skip(numSkip)
        // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
        .sort({ createdDate: -1 });
    totalPages = Math.ceil(count / limit);
    if (data)
        return { result: true, message: 'Service Found', data, metadata: { totalPages, page, limit } };

    return { result: false, message: 'Service Not Found' };
}

async function getById(id) {
    try {
        const data = await Main_Category.findById(id);
        if (data)
            return { result: true, data, message: 'Category found' };
        return { result: false, message: 'Category not found' };
    } catch (e) {
        return { result: false, message: e.message };
    }
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