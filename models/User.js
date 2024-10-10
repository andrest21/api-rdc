const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    id_institution: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        enum: ['user_admin', 'user_gen'],
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    token_access: {
        type: String,
        required: false
    },
    date_token_created: {
        type: Date,
        required: false
    }
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('User', userSchema);