/**
 * Module to handle the socket login event.
 * @module Socket Login Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

// At the start, import the needed modules
import argon2 from 'argon2';
import wordFilter from 'whoolso-word-filter';
import { wordsToFilter, lengthThreshold, leetAlphabet1, leetAlphabet2, shortWordLength, shortWordExceptions } from '../../util/FilterConstants.js';

const { filterWords } = wordFilter;

function handleLogin({io, socket, username, password, server}) {
  // Check the client sent variables to make sure they are defined and of type string,
  // and if any of them aren't, deny their login.
  if (typeof username !== 'string' || typeof password !== 'string' || typeof server !== 'string') {
    socket.emit('login denied', {
      loginDeniedReason: 'Invalid login request.'
    });
    return;
  }

  const filterOptions = {
    wordsToFilter: wordsToFilter,
    stringToCheck: username,
    lengthThreshold: lengthThreshold,
    leetAlphabet1: leetAlphabet1,
    leetAlphabet2: leetAlphabet2,
    shortWordLength: shortWordLength,
    shortWordExceptions: shortWordExceptions
  }

  // Check the username for bad words
  const filterFoundWords = filterWords(filterOptions);

  if (filterFoundWords.length != 0) {
    socket.emit('login denied', {
      loginDeniedReason: 'Username contains bad words.'
    });
    return;
  }

  let userHashedPassword;
  let statusMessage = '';

  // Execute all this if the user has supplied credentials that could potentially be valid
  if (username.length <= 16 && password.length <= 16 && server.length <= 16 && username.length > 0 && password.length > 0 && server.length > 0) {
    // Password-hashing helper function
    const hashPassword = async (password) => {
      try {
        const hashedPassword = await argon2.hash(password);
        return hashedPassword;
      }
      catch (error) {
        console.error(`ERROR: Cannot hash password: ${error}`);
      }
    }

    // Verify-password helper function
    const verifyPassword = async (hashKey, password) => {
      try {
        if (await argon2.verify(hashKey, password)) {
          return 'match';
        }
        else {
          return 'noMatch';
        }
      }
      catch (error) {
        return console.error(`ERROR: Cannot verify password: ${error}`);
      }
    }

    // Securely hash the user's password, then call verifyLogin() to verify the login attempt
    hashPassword(password).then(hashedPassword => {
      userHashedPassword = hashedPassword;
      verifyLogin();
    });

    // Verify the user's login attempt
    // eslint-disable-next-line no-inner-declarations
    function verifyLogin() {
      global.userModel.countDocuments({username: username.toLowerCase()}, function(err, count) {
        // Create an object with the user credentials
        const credentials = {
          'username': username.toLowerCase(),
          'hashedPassword': userHashedPassword
        }

        // Create the mongoose document for a user using the user model
        const userDocument = new userModel({
          'username': username.toLowerCase(),
          'hashedPassword': userHashedPassword
        });

        // If there's an error, show an error in the console and return
        if (err) return console.error(err);
        // If a match is found for the username, perform credential checking and either deny or allow login
        if (count > 0) {
          global.userModel.findOne({username: username.toLowerCase()}, function(err, user) {
            async function getUserVerification() {
              const userVerification = await verifyPassword(user.hashedPassword, password);
              return userVerification;
            }
            getUserVerification().then(userVerification => {
              if (userVerification == 'match') {
                statusMessage = user.statusMessage;
                allowLogin();
              }
              else if (userVerification == 'noMatch') {
                socket.emit('login denied', {
                  loginDeniedReason: 'Username already exists/Invalid Password'
                });
              }
            });
          });
        }
        // If no match is found for the username, register the user in the database, and then call allowLogin() to let them in
        else {
          userDocument.save(function (error, user) {
            if (error) return console.error(`An error occurred while attempting to register user ${socket.username} in the database: ${error}`);
            allowLogin();
          });
        }
      });
      // Function to allow a user in
      async function allowLogin() {
        // Store login info in the local session once they are authenticated
        socket.username = username;
        socket.password = password;
        socket.server = server;
        // Join the user to their server
        socket.join(socket.server);
        // Mark them as authenticated
        socket.authenticated = true;
        // Tell the user that their login has been authorized
        socket.emit('login authorized');
        // Define user object
        const user = {
          username: socket.username,
          statusMessage: statusMessage
        }
        // Echo to the server that a person has connected
        socket.to(socket.server).emit('user joined', user);
        // Create the user list contents for the server if it doesn't exist
        if (typeof global.userListContents[socket.server] == 'undefined') {
          global.userListContents[socket.server] = [];
        }
        // Add the user to the user list contents for their server
        global.userListContents[socket.server].push(user);
        // Send the user list contents to the user for their server
        socket.emit('user list', global.userListContents[socket.server]);

        global.userModel.findOne({username: socket.username.toLowerCase()}, function (error, user) {
          if (user == null) {
            return console.warn(`User ${socket.username} was not in the database when handling the socket Login event, fetching the server list for the user!`);
          }
          if (error) {
            return console.error(`An error occured while trying to fetch user ${socket.username} from the database while handling the socket Login event, fetching the server list for the user`);
          }

          // Send the server list contents for the user to the user
          socket.emit('server list', user.serverList);
        });

        // Count amount of servers in the database with the server name the user is in
        global.serverModel.countDocuments({serverName: socket.server}, function(error, count) {
          // Server is already in the database, so send the client the initial message list and return
          if (count > 0) {
            global.messageModel.countDocuments({server: socket.server}).then((count) => {
              if (count > 50) {
                global.messageModel.find({server: socket.server}).skip(count - 50).limit(50).then((messages) => {
                  // Send the initial message list to the client (array of messages)
                  socket.emit('initial message list', messages, false);
                }).catch((error) => {
                  // Catch and show an error in console if there is one
                  console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
                });
              } else {
                global.messageModel.find({server: socket.server}).limit(50).then((messages) => {
                  // Send the initial message list to the client (array of messages)
                  socket.emit('initial message list', messages, true);
                }).catch((error) => {
                  // Catch and show an error in console if there is one
                  console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
                });
              }
            }).catch((error) => {
              // Catch and show an error in console if there is one
              console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
            });
            return;
          }
          // Else, make a new entry of the server
          else {
            // Create the mongoose document for a server using the server model
            const serverDocument = new global.serverModel({
              serverName: socket.server,
              serverOwner: socket.username
            });

            // Save the server in the database
            serverDocument.save(function (error, server) {
              if (error) console.error(`An error occurred while attempting to save the server ${socket.server} created by ${socket.username} to the database: ${error}`);
            });

            // Tell the user this is a new server
            socket.emit('new server');
          }
        });

        // Add the user's socket id to their connections array
        global.userConnectionsMap.insert(socket.username, socket.id);

        // If they're muted, tell them they are muted
        if (global.mutedList.includes(socket.username) || global.mutedIpList.includes(socket.handshake.headers['cf-connecting-ip'] || socket.handshake.address)) {
          socket.emit('mute');
        }

        // Create timestamp for usage logging
        const timestamp = new Date().toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Usage logging
        console.log(`${timestamp} | ${socket.username} joined server: ${socket.server}`);
      }
    }
  }
  // Check if the user used too many characters in their username
  else if (username.length > 16) {
    socket.emit('login denied', {
      loginDeniedReason: 'Username cannot be longer than 16 characters'
    });
    return;
  }
  // Check if the user used too many characters in their password
  else if (password.length > 16) {
    socket.emit('login denied', {
      loginDeniedReason: 'Password cannot be longer than 16 characters'
    });
    return;
  }
  // Check if the user used too many characters in their server
  else if (server.length > 16) {
    socket.emit('login denied', {
      loginDeniedReason: 'Password cannot be longer than 16 characters'
    });
    return;
  }
  // Check if the user did not enter a username
  else if (username.length == 0) {
    socket.emit('login denied', {
      loginDeniedReason: 'Username cannot be empty'
    });
    return;
  }
  // Check if the user did not enter a password
  else if (password.length == 0) {
    socket.emit('login denied', {
      loginDeniedReason: 'Password cannot be empty'
    });
    return;
  }
  // Check if the server is blank
  else if (server.length == 0) {
    socket.emit('login denied', {
      loginDeniedReason: 'Server cannot be empty'
    });
    return;
  }
}

// Export the handleLogin function as the default export
export default handleLogin;
