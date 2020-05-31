const mongoose = require('mongoose');


const Schema = mongoose.Schema;

let Rota  = new Schema({
    employeeID: {
        type: String,
        required: true
    },
    records: [{ clientName: String, typeOfScan: String, dateTime: String}],

    status: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model('Rota', Rota);