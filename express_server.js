const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
let cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');
const urlDatabase = {
  'b2xVn2': "http://www.lighthouselabs.ca",
  '9sm5xK': "http://www.google.com"
};

app.post('/urls/:shortURL/delete', (req, res) => {
  console.log('in post');
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  console.log('in post');
  urlDatabase[req.params.shortURL] = req.body.newURL;
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
  let templateVars = { urls: urlDatabase
  };
  console.log(req.cookies);
  if (req.cookies !== undefined) {
    templateVars.username = req.cookies["username"];
  }
  
  res.render("urls_index", templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {};
  if (req.cookies !== undefined) {
    templateVars.username = req.cookies["username"];
  }
  res.render("urls_new",templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  if (req.cookies !== undefined) {
    templateVars.username = req.cookies["username"];
  }
  res.render("urls_show",templateVars);
});

app.post('/urls', (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL',(req, res) => {
  let shortURL = req.params.shortURL;
  let longURL =  urlDatabase[shortURL];
  res.redirect(`${longURL}`);
});

app.post('/login', (req, res) => {
  res.cookie('username',req.body.username).redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username','');
  res.redirect('/urls');
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

