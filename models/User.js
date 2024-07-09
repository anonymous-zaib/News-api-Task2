const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
        unique: true,
    },
    password: {
        type: String,
        require: true,
    },
    isAdmin: {
        type: Boolean,
        default: false, // Default to regular user
    },
    isActive: {
        type: Boolean,
        default: true, // Default to active
    },
    profilePicture: {
        type: String,
        default: '',
    },
},
{
    timestamps: true,
});

userSchema.pre('save', async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }
    next()
});


const User = mongoose.model('User', userSchema);
module.exports = User