//jshint esversion:6
require('dotenv').config();
const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const { stringify } = require('querystring');

const encrypt=require('mongoose-encryption');

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/usersDB");

const usersSchema=new mongoose.Schema({
    email:String,
    password:String
});

const secret=process.env.SECRET;
usersSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User=mongoose.model("User",usersSchema);



app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    const user= new User({
        email:req.body.username,
        password:req.body.password
    });
    user.save((err)=>{
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post("/login",(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({email:username},(err,founduser)=>{
        if(err){
            console.log(err);           
        }else{
            if(founduser){
                if(founduser.password === password){
                    console.log("loging");
                    res.render("secrets");
                }else{
                    console.log("wrong password");
                    res.send("wrong password");
                }
                
            }                       
        }
    })
});








app.listen(3000,()=>{
    console.log("server started on port 3000.")
})
