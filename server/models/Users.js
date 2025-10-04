const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    uID:String,
    uAvatar: {type:String,default:"https://reus.oss-cn-shenzhen.aliyuncs.com/images/maodie.jpg"},
    uName: String,
    Password: String,
    Friends: [{
      uID: String
    }]
})

module.exports = mongoose.model("Users",userSchema)