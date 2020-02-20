const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended:true}));
let cookieParser = require('cookie-parser');

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

const urlDatabase = {
  'b2xVn2': { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  '9sm5xK': { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

app.use(cookieParser());

app.set('view engine', 'ejs');

app.post('/urls/:shortURL/delete', (req, res) => {
  console.log('in post');
  let userSpecificURLs = urlsForUser(req.cookies["user_id"]);
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      delete urlDatabase[req.params.shortURL];
        
    }
  }
  //delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  console.log('in post');
  let userSpecificURLs = urlsForUser(req.cookies["user_id"]);
  for (let key of Object.keys(userSpecificURLs)) {
    if (key === req.params.shortURL) {
      urlDatabase[req.params.shortURL].longURL = req.body.newURL;
        
    }
  }
  
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  let templateVars = { };

  if (!req.cookies || !req.cookies["user_id"]) {
    res.redirect('/login');
  }
 
  templateVars.user = users[req.cookies["user_id"]];
  templateVars.urls = urlsForUser(req.cookies["user_id"]);
  
  
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {};
  console.log("cookies",req.cookies);
  if (!req.cookies || !req.cookies["user_id"]) {
    res.redirect('/login');
  }
  templateVars.user = users[req.cookies["user_id"]];
  res.render("urls_new",templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
   
  

  if (req.cookies !== undefined) {
    templateVars.user = users[req.cookies["user_id"]];
    let userSpecificURLs = urlsForUser(req.cookies["user_id"]);
    for (let key of Object.keys(userSpecificURLs)) {
      if (key === templateVars.shortURL) {
        res.render("urls_show",templateVars);
      }
    }
    
  }
  res.send('Not accessible');

});

app.post('/urls', (req, res) => {
  console.log('entered post');
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  console.log('short',shortURL);
  console.log('long',longURL);
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]['longURL'] = longURL;
  urlDatabase[shortURL]['userID'] = req.cookies["user_id"];
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL',(req, res) => {
  let shortURL = req.params.shortURL;
  let longURL =  urlDatabase[shortURL]['longURL'];
  res.redirect(`${longURL}`);
});


app.post('/logout', (req, res) => {
  res.clearCookie('user_id','');
  res.redirect('/login');
});

const generateRandomString =  function() {
  const alphabetString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let newString = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * 52);
    newString += alphabetString[randomIndex];
  }
  return newString;
};

app.get('/register', (req, res) => {
  let templateVars = {};
  if (req.cookies !== undefined) {
    templateVars.user = users[req.cookies["user_id"]];
    
  }
  res.render("register",templateVars);
});

app.post('/login', (req, res) => {
 
  let emailId = req.body.email;
  let password = req.body.password;
  if (!emailId || !password) {
    res.status(400).send('BAD REQUEST');
  }

  let loggedInUser = emailLookUp(emailId);
  if (loggedInUser) {
    // if (password !== loggedInUser.password) {
    console.log('password',loggedInUser.password);
    console.log('bcrypt output',!bcrypt.compareSync(password,loggedInUser.password));
    if (!bcrypt.compareSync(password,loggedInUser.password)) {
      console.log('password=',loggedInUser.password);
      res.status(403).send('BAD REQUEST');
    }
    res.cookie('user_id',loggedInUser.id);
    res.redirect("/urls");
  } else {
    res.status(403).send('BAD REQUEST');
  }
  
  res.redirect('/login');
});


app.get('/login', (req, res) => {
  let templateVars = {};
  if (req.cookies !== undefined) {
    templateVars.user = users[req.cookies["user_id"]];
    
  }
  res.render("login",templateVars);
});

const emailLookUp = function(email) {
  let existingEntries = Object.values(users);
  let found = existingEntries.find(x => x.email === email);
  if (found) {
    return found;
  }

  return false;
};
app.post('/register', (req, res) => {
  const randomID = "U" + generateRandomString();
  const emailId = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!emailId || !password || emailLookUp(emailId)) {
    res.status(400).send('BAD REQUEST');
  }
  let newUser =  {
    id: randomID,
    email: emailId,
    password: hashedPassword
    //password: req.body.password
  };
  users[randomID] = newUser;
  res.cookie('user_id',randomID);
  console.log(users);
  res.redirect("/urls");
});

const urlsForUser = function(id) {
  
  let urlsObjectsForUser = {};
  for (let key of Object.keys(urlDatabase)) {
   
    if (urlDatabase[key]['userID'] === id) {
      
      urlsObjectsForUser[key] = urlDatabase[key];
     
    }
  }

  return urlsObjectsForUser;
  

};


