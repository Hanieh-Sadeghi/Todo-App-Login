if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const PORT = 3000;
const router = require("./router");

const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const path = require("path");

const users = [];

app.use(express.json());
app.use("/api", router);
app.use(express.static(path.join(__dirname, "../views")));
app.use(bodyParser.urlencoded({ extended: false }));

const initializePassport = require("./passport-config");
const { register } = require("module");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

app.set("view-engine", "ejs");
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method "));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", checkNotAuthenticated, (req, res) => {
  res.render("index.ejs"); //req.user.username
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/todo",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  console.log("register");
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      id: crypto.randomUUID(),
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    };
    users.push(user);
    req.login(user, function (err) {
      if (err) {
        throw err;
      }
      res.redirect("/todo");
    });
  } catch {
    res.redirect("/register");
  }
  console.log(users);
});

app.get("/todo", checkAuthenticated, (req, res) => {
  res.render("todo.ejs", { username: req.user.username });
});

app.post("/logout", (req, res) => {
  console.log('logOut')
  req.logOut(function(err) {
    if (err) { return next(err); }
    res.redirect("/login");
  })
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/todo");
  }
  next();
}

app.listen(3000, () => {
  console.log(`listening pn port ${PORT}`);
});
