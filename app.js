/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { poll, manager,users } = require("./models");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
const path = require("path");
const { response } = require("express");
const flash = require("connect-flash");
app.set("views", path.join(__dirname, "views"));
app.use(flash());
const passport = require("passport");
const LocalStrategy = require("passport-local");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const bcrypt = require("bcrypt");
const saltRound = 10;

app.use(
  session({
    secret: "my-secret-ket-232423234234234234",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      manager.findOne({
        where: {
          Email: username,
        },
      })
        .then(async (user) => {
          if (user) {
            const bool = await bcrypt.compare(password, user.Password);
            if (bool) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: "Invalid password",
              });
            }
          } else {
            return done(null, false, {
              message: "User does not exist with this email",
            });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialize the user with Id : ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  manager.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname + "/public")));
app.use(cookieParser("Important string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.use(function (req, res, next) {
  const data = req.flash();
  res.locals.messages = data;
  next();
});
app.get("/", async (req, res) => {
  if (req.session.passport) {
    res.redirect("/poll");
  } else {
    res.render("index", {
      csrfToken: req.csrfToken(),
    });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "signUp",
    csrfToken: req.csrfToken(),
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "login",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.user);
    res.redirect("/poll");
  }
);

app.post("/users", async (req, res) => {
  console.log("Body : ", req.body.firstName);
  const pwd = await bcrypt.hash(req.body.password, saltRound);
  try {
    const user = await manager.create({
      FirstName: req.body.firstName,
      LastName: req.body.lastName,
      Email: req.body.email,
      Password: pwd,
    });
    req.logIn(user, (err) => {
      if (err) {
        console.log(err);
      }
      return res.redirect("/poll");
    });
  } catch (error) {
    console.log(error);
    console.log(error.name);
    if (error.name == "SequelizeValidationError") {
      error.errors.forEach((e) => {
        if (e.message == "Please provide a firstName") {
          req.flash("error", "Please provide a firstName");
        }
        if (e.message == "Please provide email_id") {
          req.flash("error", "Please provide email_id");
        }
      });
      return res.redirect("/signup");
    } else if (error.name == "SequelizeUniqueConstraintError") {
      error.errors.forEach((e) => {
        if (e.message == "email must be unique") {
          req.flash("error", "User with this email already exists");
        }
      });
      return res.redirect("/signup");
    } else {
      return response.status(422).json(error);
    }
  }
});
app.post("/poll/new", async (request, response)=> {
    const title1= request.body.title;
    const loggedInUser = request.user.id;
  
    try {
      const Election1=await poll.addelection({
        title:request.body.title,
        adminId:loggedInUser,
        
      });
      
      
      response.redirect("/poll");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  });
  app.get('/poll',connectEnsureLogin.ensureLoggedIn(),async (request,response)=>{

    const loggedInUser = request.user.id;
    const Election = await poll.newlyadded(loggedInUser);
  
    if (request.accepts("html")) {
      response.render("poll", {
        Election,
        csrfToken: request.csrfToken(),
      });
    }
    else{
      response.json({
        Election,
      })
    }
  
  
   
  });

app.get('/new',connectEnsureLogin.ensureLoggedIn(),function(req,res){
    res.render('new',{csrfToken: req.csrfToken()});
});



app.post("/poll/:id/voters", async (request,response)=>{

    const hashedpwd = await bcrypt.hash(request.body.Password, saltRound)
    
    const email=request.body.voterid
    const Election1 = await poll.findByPk(request.params.id);
    console.log(email)
    
  try{
    
    const users1 = await users.addvoters({
      email:email,
      password:hashedpwd,
      pollid:request.params.id,
      
    });
    
    if (request.accepts("html")) {
      console.log("Html Request");
      return response.redirect(`/poll/${request.params.id}/voters`);
  }
  else {
      return response.json(users1);
  }
    
  }
  catch(error){
  console.log(error);
  request.flash("error", error.message);
  }
  
  });

  app.get('/voters/:id',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
    const poll1 = await poll.findByPk(request.params.id);
    console.log("pollid",request.params.id)
    const users1 = await users.findAll({ where: { pollid: request.params.id } });
    console.log(users1)
    response.render("voters", {
      id:request.params.id,
      poll1,
      users1,
      csrfToken: request.csrfToken(), 
  });
  });

  app.post("/poll/:id/voters",connectEnsureLogin.ensureLoggedIn(), async (request,response)=>{

    const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
    
    const email=request.body.voterid
    const Election1 = await poll.findByPk(request.params.id);
    console.log(email)
    
  try{
    
    const voters1 = await users.addvoters({
      email:email,
      password:hashedpwd,
      pollid:request.params.id,
      
    });
    
    if (request.accepts("html")) {
      console.log("Html Request");
      return response.redirect(`/poll/${request.params.id}/voters`);
  }
  else {
      return response.json(voters1);
  }
    
  }
  catch(error){
  console.log(error);
  request.flash("error", error.message);
  }
  
  });

  app.get('/poll/:id/voters',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
    const election1 = await poll.findByPk(request.params.id);
    const users1 = await users.findAll({ where: { pollid: request.params.id } });
    
    response.render("voters", {
      id:request.params.id,
      election1,
      users1,
      csrfToken: request.csrfToken(), 
      
    
  });
  });
  
  

module.exports = app;
