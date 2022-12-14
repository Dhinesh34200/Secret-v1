//jshint esversion:6
require('dotenv').config();
const express=require('express');
const ejs=require('ejs');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const { stringify } = require('querystring');
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose =require('passport-local-mongoose');
const { env } = require('process');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')




const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB");

const usersSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);
const secret=process.env.SECRET;


const User=mongoose.model("User",usersSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/",(req,res)=>{
    res.render("home");
});


app.get("/auth/google",
passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
    
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    User.find({"secret":{$ne:null}},(err,founduser)=>{
        if(err){
            console.log(err);
        }else{
            console.log(founduser);
            if(founduser){
                res.render("secrets",{userWithSecrets:founduser});
            }
        }
    });

});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",(req,res)=>{
    const submittedSecret=req.body.secret;
    User.findById(req.user.id,(err,founduser)=>{
        if(err){
            console.log(err);
        }else{
            if(founduser){
                founduser.secret=submittedSecret;
                founduser.save(function(){
                    res.redirect("/secrets");
                });
            }

        }
    })
});


app.post("/register",(req,res)=>{
    User.register({username:req.body.username}, req.body.password, function(err, user) { 
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
});
});
    

app.post("/login",(req,res)=>{
    const user= new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,(err)=>{
        if(err){
            console.log("error");
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});








app.listen(3000,()=>{
    console.log("server started on port 3000.")
})
