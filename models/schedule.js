const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let Schedule = new Schema({
    employeeID: {
        type: String,
        required: true,
    },
    records: [{
        weekNumber: String,
        sunday: String,
        monday: String,
        tuesday: String,
        wednesday: String,
        thursday: String,
        friday: String,
        saturday: String
    }]
});


module.exports = mongoose.model('Schedule', Schedule);
