const mongoose=require("mongoose")

const accounts=new mongoose.Schema({
    website: String,
    email: String,
    password: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', },

})

const account=new mongoose.model("accounts",accounts)

module.exports=account
    