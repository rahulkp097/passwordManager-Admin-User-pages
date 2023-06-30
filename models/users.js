const mongoose=require("mongoose")

const usersSchema=new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    
})

    



const User=new mongoose.model("user",usersSchema)

module.exports=User