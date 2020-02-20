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

module.exports = {
  getUserByEmail
};