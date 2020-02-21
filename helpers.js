// Checks if email exists. If exists return the user id.
const getUserByEmail = function(email, usersDB) {
  let user;
  let existingEntries = Object.values(usersDB);
  let foundUser = existingEntries.find(x => x.email === email);
  if (foundUser) {
    user = foundUser.id;
  }
  
  return user;
};

// Returns a random string
const generateRandomString = function() {
  const alphabetString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let newString = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * 52);
    newString += alphabetString[randomIndex];
  }
  return newString;
};

// Returns the urls (database entries) of the user with provided id.
const urlsForUser = function(id,urlDatabase) {

  let urlsObjectsForUser = {};
  for (let key of Object.keys(urlDatabase)) {

    if (urlDatabase[key]['userID'] === id) {

      urlsObjectsForUser[key] = urlDatabase[key];

    }
  }

  return urlsObjectsForUser;


};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};