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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['12345A']
}));

// EJS
app.set('view engine', 'ejs');


/* Endpoints start */

// Index page
app.get('/', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect('/urls');
    return;
  } else {

    res.redirect('/login');
  }
 
});


// Post url
app.post('/urls', (req, res) => {
  console.log('entered post');
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  console.log('short', shortURL);
  console.log('long', longURL);
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]['longURL'] = longURL;
  urlDatabase[shortURL]['userID'] = req.session["user_id"];
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log('in post');
  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  let userSpecificURLs = urlsForUser(req.session["user_id"],urlDatabase);
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      delete urlDatabase[req.params.shortURL];

    }
    if (!userSpecificURLs) {
      res.send('Permission denied');
      return;
    }
  }

  res.redirect('/urls');
});

// Update URL
app.post('/urls/:shortURL', (req, res) => {
  console.log('in post');
  if (!req.session["user_id"]) {
    res.send('Permission Denied');
    return;
  }
  let userSpecificURLs = urlsForUser(req.session["user_id"],urlDatabase);
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      urlDatabase[req.params.shortURL].longURL = req.body.newURL;

    }
  }

  if (!userSpecificURLs) {
    res.send('Permission denied');
    return;
  }

  res.redirect('/urls/');
});





// URLS in json format
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// hello page
app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Get urls
app.get('/urls', (req, res) => {
  let templateVars = {};

  if (!req.session || !req.session["user_id"]) {
    res.redirect('/login');
    return;
  }

  templateVars.user = users[req.session["user_id"]];
  templateVars.urls = urlsForUser(req.session["user_id"],urlDatabase);


  res.render("urls_index", templateVars);
});


//  new url form
app.get('/urls/new', (req, res) => {
  let templateVars = {};
  console.log("session", req.session);
  if (!req.session || !req.session["user_id"]) {
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
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  
  if (req.session !== undefined) {
    templateVars.user = users[req.session["user_id"]];
    let userSpecificURLs = urlsForUser(req.session["user_id"],urlDatabase);
    for (let key of Object.keys(userSpecificURLs)) {
      if (key === templateVars.shortURL) {
        res.render("urls_show", templateVars);
      }
    }

  } else {
    res.send('Not accessible');
  }

});




// Get short url
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send('URL does not exist');
    return;
  }
  let longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(`${longURL}`);
});




// Register form
app.get('/register', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  let templateVars = {};
  if (req.session !== undefined) {
    templateVars.user = users[req.session["user_id"]];

  }
  res.render("register", templateVars);
});

// Register
app.post('/register', (req, res) => {

 
  const randomID = "U" + generateRandomString();
  const emailId = req.body.email;
  const password = req.body.password;
  if (!emailId || !password) {
    res.status(400).send('EMAIL ID AND PASSWORD CANNOT BE EMPTY');
    return;
  }

  if (getUserByEmail(emailId,users)) {
    res.status(400).send('EMAIL exists');
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let newUser = {
    id: randomID,
    email: emailId,
    password: hashedPassword

  };
  users[randomID] = newUser;


  req.session['user_id'] = randomID;
  console.log(users);
  res.redirect("/urls");
});

// Login form
app.get('/login', (req, res) => {
  let templateVars = {};

  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  
  if (req.session !== undefined) {
    templateVars.user = users[req.session["user_id"]];
  }

  res.render("login", templateVars);
});

// Login
app.post('/login', (req, res) => {

  let emailId = req.body.email;
  let password = req.body.password;
  if (!emailId || !password) {
    res.status(400).send('USERNAME AND PASSWORD CANNOT BE BLANK');
    return;
  }

  let loggedInUser = getUserByEmail(emailId,users);
  console.log(users);
  if (loggedInUser) {

    if (!bcrypt.compareSync(password, users[loggedInUser]['password'])) {
      console.log('password=', users[loggedInUser].password);
      res.status(422).send('INVALID USERNAME OR PASSWORD');
      return;
    }

    req.session['user_id'] = loggedInUser;
    res.redirect("/urls");
    return;
  } else {
    res.status(402).send('INVALID USERNAME OR PASSWORD');
  }

  //res.redirect('/login');
});

// Logout
app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/login');
});

// Endpoints end

//Server listens on port for connections
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});






