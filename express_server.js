const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// Users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$5MfULDSpDayvdG5/M1YcoeRu4Kng5XuQWZh3dotpSYM/29ymu1c52"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$.WGYL80FaSGeVkDXX1NQCuiaOZ5pNyoBGNnP9fsB9zXf.7yv43fEa"
  }
};

// Temporary Database
const urlDatabase = {
  'b2xVn2': {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  '9sm5xK': {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

// middleware
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['12345A']
}));

// EJS
app.set('view engine', 'ejs');


/* Endpoints start */

// Home page. If user is not logged in, redirects to login page. Otherwise to urls page.
app.get('/', (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect('/login');
    return;
  }
  res.redirect('/urls');
});

// Login form.  If user is already logged in, will redirect to urls page
app.get('/login', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  let templateVars = {};
  templateVars.user = undefined;
  res.render("login", templateVars);
});

// Login  Users credentials are validated.
app.post('/login', (req, res) => {
  let emailId = req.body.email;
  let password = req.body.password;
  if (!emailId || !password) {
    res.status(422).send('USERNAME AND PASSWORD CANNOT BE BLANK');
    return;
  }

  let loggedInUser = getUserByEmail(emailId, users);
  if (!loggedInUser) {
    res.status(422).send('INVALID USERNAME OR PASSWORD');
    return;
  }

  if (!bcrypt.compareSync(password, users[loggedInUser]['password'])) {
    res.status(422).send('INVALID USERNAME OR PASSWORD');
    return;
  }

  req.session['user_id'] = loggedInUser;
  res.redirect("/urls");

});

// Register form  If user is logged in, redirects to Urls page, otherwise to register form
app.get('/register', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  let templateVars = {};
  templateVars.user = undefined;
  res.render("register", templateVars);
});

// Register
app.post('/register', (req, res) => {
  const emailId = req.body.email;
  const password = req.body.password;
  if (!emailId || !password) {
    res.status(422).send('EMAIL ID AND PASSWORD CANNOT BE EMPTY');
    return;
  }

  if (getUserByEmail(emailId, users)) {
    res.status(422).send('EMAIL exists');
    return;
  }

  const randomID = "U" + generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  let newUser = {
    id: randomID,
    email: emailId,
    password: hashedPassword

  };
  users[randomID] = newUser;
  req.session['user_id'] = randomID;
  res.redirect("/urls");
});


// Logout
app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/login');
});


// Post url
app.post('/urls', (req, res) => {
  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]['longURL'] = longURL;
  urlDatabase[shortURL]['userID'] = req.session["user_id"];
  res.redirect(`/urls/${shortURL}`);
});

// Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  let userSpecificURLs = urlsForUser(req.session["user_id"], urlDatabase);
  if (!userSpecificURLs) {
    res.send('Permission denied');
    return;
  }
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
      return;
    }
 
  }
  res.send('Permission denied');
 
});

// Update URL
app.post('/urls/:shortURL', (req, res) => {
  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  let userSpecificURLs = urlsForUser(req.session["user_id"], urlDatabase);
  if (!userSpecificURLs) {
    res.send('Permission denied');
    return;
  }
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      urlDatabase[req.params.shortURL].longURL = req.body.newURL;
      res.redirect('/urls/');
      return;
    }
  }

 
  res.send('Permission denied');
});


//Get urls
app.get('/urls', (req, res) => {
  
  if (!req.session["user_id"]) {
    res.redirect('/login');
    return;
  }

  let templateVars = {};

  templateVars.user = users[req.session["user_id"]];
  templateVars.urls = urlsForUser(req.session["user_id"], urlDatabase);

  res.render("urls_index", templateVars);
});


//  new url form
app.get('/urls/new', (req, res) => {
  let templateVars = {};
  if (!req.session["user_id"]) {
    res.redirect('/login');
    return;
  }
  templateVars.user = users[req.session["user_id"]];
  res.render("urls_new", templateVars);
});


// Get short url
app.get('/urls/:shortURL', (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.send('URL does not exist');
    return;
  }
  

  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  let userSpecificURLs = urlsForUser(req.session["user_id"], urlDatabase);
  if (!userSpecificURLs) {
    res.send('Permission denied');
    return;
  }
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL
      };
      templateVars.user = users[req.session["user_id"]];
      
      for (let key of Object.keys(userSpecificURLs)) {
        if (key === templateVars.shortURL) {
          res.render("urls_show", templateVars);
          return;
        }
      }
    }
 
  }
  
  res.send('Not accessible');
   
});


// Get long url from short url
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send('URL does not exist');
    return;
  }
  let longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(`${longURL}`);
});

// Endpoints end

//Server listens on port for connections
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});






