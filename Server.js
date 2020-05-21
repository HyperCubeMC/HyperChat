// At the start, require the needed modules
const { URL } = require('url');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Filter = require('bad-words'),
    filter = new Filter();
const showdown = require('showdown');
const xssFilter = require('showdown-xss-filter');
const argon2 = require('argon2');

// Set the process title
process.title = 'HyperChat';

// Options for the web server including the TLS Certificate and allowing http1
const options = {
  cert: fs.readFileSync('/Users/evere/Servers/Certificates/ECDSA/chain.pem'),
  key: fs.readFileSync('/Users/evere/Servers/Certificates/ECDSA/key.pem'),
  allowHTTP1: true
}

// Use http2 to create an https web server
const app = require('http2').createSecureServer(options, server);
const io = require('socket.io')(app);

// Listen on this port
app.listen(4434);

// The request and response handler
function server (req, res) {
  // Stop Poison Null Byte attacks
  if (req.url.indexOf('\0') !== -1 || req.url.indexOf('%00') !== -1) {
    res.writeHead(400);
    res.end('400 Bad Request\nPoison Null Bytes are evil.');
    return;
  }

  // Define the request url variable
  let reqURL;

  // Set a base url variable for the web app to the request hostname
  const baseURL = `https://${req.headers.host}/`;

  // Try and make a new URL for the requested URL
  // If it fails due to an invalid url provided, send back 400 Bad Request
  try {
    reqURL = new URL(req.url, baseURL);
  } catch (error) {
    res.writeHead(400);
    res.end('400 Bad Request\nInvalid URL supplied.');
    return;
  }

  // If the URL is simply a slash or home url, send the chat app html page
  if (reqURL.pathname == '/')
    reqURL.pathname = '/chat.html';

  // Set the path to the requested resource based on the URL
  const pathname = path.join(process.cwd(), reqURL.pathname);

  // Set the extension name variable based on the file extension in the pathname
  const extname = String(path.extname(pathname)).toLowerCase();
  // Define mime types based on file extension in the mimeType object
  const mimeTypes = {
    '': 'text/html',
    '.aac': 'audio/aac',
    '.apng': 'image/apng',
    '.avi': 'video/x-msvideo',
    '.bmp': 'image/bmp',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.eot': 'application/vnd.ms-fontobject',
    '.epub': 'application/epub+zip',
    '.gif': 'image/gif',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.ics': 'text/calendar',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jsonld': 'application/ld+json',
    '.md': 'application/markdown',
    '.mhtml': 'message/rfc822',
    '.mid': 'audio/midi',
    '.midi': 'audio/midi',
    '.mjs': 'text/javascript',
    '.mp3': 'audio/mp3',
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.oga': 'audio/ogg',
    '.ogg': 'application/ogg',
    '.ogv': 'video/ogg',
    '.ogx': 'application/ogg',
    '.opus': 'audio/opus',
    '.otf': 'font/otf',
    '.pdf': 'application/pdf',
    '.php': 'application/php',
    '.png': 'image/png',
    '.rtf': 'application/rtf',
    '.sfnt': 'font/sfnt',
    '.svg': 'image/svg+xml',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
    '.wav': 'audio/wav',
    '.weba': 'audio/webm',
    '.webm': 'video/webm',
    '.webp': 'image/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xhtml': 'application/xhtml+xml',
    '.xml': 'application/xml'
  };

  // Set the content type sent back to the client which will either be one of the mime types defined or octet-stream
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Try to read the requested file based on the pathname
  fs.readFile(pathname, function (error, content) {
    // If there's an error, handle it
    if (error) {
      // If the error is that the file is not found, send the 404 Not Found page
      if (error.code == 'ENOENT') {
        fs.readFile('./errors/404.html', function (error, content) {
          res.writeHead(404, {
            'Content-Type': 'text/html'
          });
          res.end(content, 'utf-8');
        });
      // If the error code is not file not found, send a generic 500 error indicating something went wrong
      } else {
        res.writeHead(500);
        res.end(`Error: ${error.code}\nSomething went wrong.`);
      }
    // Yay, there's no error, so send the requested content back to the client
    } else {
      res.writeHead(200, {
        'Content-Type': contentType
      });
      res.end(content, 'utf-8');
    }
  });
}


// In the beginning, there was the chat app code...

// Helper function to return an array with the value specified removed from the passed array
function arrayRemove(array, value) {
  return array.filter(function(ele) {
    return ele != value;
  });
}

// Define an array for the muted users list
let mutedList = [];
// Define an array for the user list contents for servers
let userListContents = [];
// Define an array for the server list contents for a user
let serverListContents = [];

// Set the message command prefix
const prefix = '/';
// Define the user map which is used to map usernames to unique socket id's
const userMap = new Map();

// Connect to the MongoDB database using Mongoose
mongoose.connect('mongodb://localhost:27017/hyperchat', {useNewUrlParser: true, useUnifiedTopology: true});
// State that 'db' refers to the connection to the database
const db = mongoose.connection;
// If there's an error connecting to the MongoDB database, log that in the console
db.on('error', console.error.bind(console, "Connection error upon trying to connect to MongoDB!"));
// If the connection is successful, log a success message in the console
db.once('open', function(callback) {
  console.log("Connection to MongoDB successful!");
})

// Assign Mongoose Schema to Schema
let Schema = mongoose.Schema;
// Create a new Schema for user credentials
let userCredentialsSchema = new Schema({
  username: String,
  hashedPassword: String
});
// Use the user credentials Schema to make a Mongoose Model
let userCredentialsModel = mongoose.model('userCredentialsModel', userCredentialsSchema, 'credentials');

// And everything starts here where a user makes a connection to the socket.io server...
io.on('connection', (socket) => {
  var addedUser = false;

  // When the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    // Stop right there if the user tries to send a null or non-string message
    if (typeof message !== 'string' || message == null) return;
    // If the muted list includes the user trying to send the message, stop right there
    if (mutedList.includes(socket.username)) return;
    // Define a new showdown (markdown library) converter with options and an xss filter
    const converter = new showdown.Converter({extensions: [xssFilter], tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, backslashEscapesHTMLTags: true, ghMentions: true});
    // If the message length is less than 2000 characters, go ahead and filter the message, and then send it to the user's server
    if (message.length <= 2000) {
      // Clean the message with a bad word filter
      message = filter.clean(message);
      // Convert markdown to html with showdown
      let messageHtml = converter.makeHtml(message);
      // Send the message to everyone in the user's server
      io.in(socket.server).emit('new message', {
        username: socket.username,
        message: messageHtml
      });
    }
    // Check if the message is over 2000 character, and if it is, change it to a predetermined message indicating that the message is too long
    else if (message.length > 2000) {
      io.in(socket.server).emit('new message', {
        username: socket.username,
        message: 'This message was removed because it was too long (over 2000 characters).'
      });
      return;
    }
    // Get the command arguments - needs args.join(' ') later to use it
    const args = message.slice(prefix.length).trim().split(/ +/g);
    // Get the command
    const command = args.shift().toLowerCase();
    // Special commands :)
    if (socket.username == 'Justsnoopy30') {
      switch (command) {
        case 'mute':
          const mutePerson = args.join(' ');
          mutedList.push(mutePerson);
          io.to(userMap.get(mutePerson)).emit('mute');
          break;
        case 'unmute':
          const unmutePerson = args.join(' ');
          mutedList = arrayRemove(mutedList, unmutePerson);
          io.to(userMap.get(unmutePerson)).emit('unmute');
          break;
        case 'flip':
          const flipPerson = args.join(' ');
          io.to(userMap.get(flipPerson)).emit('flip');
          break;
        case 'unflip':
          const unflipPerson = args.join(' ');
          io.to(userMap.get(unflipPerson)).emit('unflip');
          break;
        case 'stupidify':
          const stupidifyPerson = args.join(' ');
          io.to(userMap.get(stupidifyPerson)).emit('stupidify');
          break;
        case 'smash':
          const smashPerson = args.join(' ');
          io.to(userMap.get(smashPerson)).emit('smash');
          break;
        case 'kick':
          const kickPerson = args.join(' ');
          io.to(userMap.get(kickPerson)).emit('kick');
          io.sockets.sockets[userMap.get(kickPerson)].disconnect();
          break;
        case 'stun':
          const stunPerson = args.join(' ');
          io.to(userMap.get(stunPerson)).emit('stun');
          break;
        default:
          break;
      }
    }
  });

  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, server }) => {
    if (addedUser) return;

    // Check the client sent variables to make sure they are defined, and if any of them don't, deny their login
    if (typeof username == 'undefined' || typeof password == 'undefined' || typeof server == 'undefined') {
      socket.emit('login denied', {
        loginDeniedReason: 'Invalid login request.'
      });
      return;
    }

    // Store login info in the local session
    socket.username = username;
    socket.password = password;
    socket.server = server;
    var userHashedPassword;

    // Execute all this if the user has supplied credentials that could potentially be valid
    if (socket.username.length <= 14 && socket.password.length <= 14 && socket.server.length <= 14 && socket.username.length > 0 && socket.password.length > 0 && socket.server.length > 0) {
      // Password-hashing helper function
      const hashPassword = async (password) => {
        try {
          const hashedPassword = await argon2.hash(password);
          return hashedPassword;
        }
        catch (err) {
          console.error(`ERROR: Cannot hash password: ${err}`);
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
        catch (err) {
          return console.error(`ERROR: Cannot verify password: ${err}`);
        }
      }

      // Securely hash the user's password, then call verifyLogin() to verify the login attempt
      hashPassword(socket.password).then(hashedPassword => {
        userHashedPassword = hashedPassword;
        verifyLogin();
      });

      // Verify the user's login attempt
      // eslint-disable-next-line no-inner-declarations
      function verifyLogin() {
        db.collection('credentials').countDocuments({username: socket.username.toLowerCase(), hashedPassword: {$exists: true}}, function(err, count) {
          // Create an object with the user credentials
          let credentials = {
            'username': socket.username.toLowerCase(),
            'hashedPassword': userHashedPassword
          }

          // Creatge the mongoose document for user credentials using the user credentials model
          let userCredentialsDocument = new userCredentialsModel({
            'username': socket.username.toLowerCase(),
            'hashedPassword': userHashedPassword
          });

          // If there's an error, log it in the console
          if (err) return console.error(err);
          // If a match is found for the username, perform credential checking and either deny or allow login
          if (count > 0) {
            db.collection('credentials').findOne({username: socket.username.toLowerCase()}, function(err, user) {
              async function getUserVerification() {
                var userVerification = await verifyPassword(user.hashedPassword, socket.password);
                return userVerification;
              }
              getUserVerification().then(userVerification => {
                if (userVerification == 'match') {
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
            userCredentialsDocument.save(function (err, credentials) {
              if (err) return console.error(err);
              allowLogin();
            });
          }
        });
        // Function to allow a user in
        const allowLogin = function() {
          // Join the user to their server
          socket.join(socket.server);
          // Tell the user that their login has been authorized
          socket.emit('login authorized');
          addedUser = true;
          // Echo to the server that a person has connected
          socket.to(socket.server).emit('user joined', {
            username: socket.username,
          });
          // Create the user list contents for the server if it doesn't exist
          if (typeof userListContents[socket.server] == 'undefined') {
            userListContents[socket.server] = [];
          }
          // Add the user to the user list contents for their server
          userListContents[socket.server].push(socket.username);
          // Send the user list contents to the user for their server
          socket.emit('user list', {
            userListContents: userListContents[socket.server]
          });

          // Create the server list contents for the user if it doesn't exist
          if (typeof serverListContents[socket.username] == 'undefined') {
            serverListContents[socket.username] = [];
            // The server list database is not implemented yet, so I'll put a server in the server list contents for the user
            serverListContents[socket.username].push({ServerName: 'HyperLand', Image: './cdn/ServerIcons/HyperLand.png', Owner: 'Justsnoopy30'});
          }
          // Send the server list contents for the user to the user
          socket.emit('server list', {
            serverListContents: serverListContents[socket.username]
          });

          // Map the user's username to a unique socket id
          userMap.set(socket.username, socket.id);
        }
      }
    }
    // Check if the user used too many characters in their username
    else if (socket.username.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Username cannot be longer than 14 characters'
      });
    }
    // Check if the user used too many characters in their password
    else if (socket.password.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Password cannot be longer than 14 characters'
      });
    }
    // Check if the user used too many characters in their server
    else if (socket.server.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Server cannot be longer than 14 characters'
      });
    }
    // Check if the user did not enter a username
    else if (socket.username.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Username cannot be empty'
      });
    }
    // Check if the user did not enter a password
    else if (socket.password.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Password cannot be empty'
      });
    }
    // Check if the user did not enter a server
    else if (socket.server.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Server cannot be empty'
      });
    }

    // Create timestamp for usage logging
    const timestamp = new Date().toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Usage logging
    console.log(`${timestamp} | ${username} joined server: ${socket.server}`);
  });

  // When the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    // socket.to(socket.server).emit('typing', {
    //   username: socket.username
    // });
    io.in(socket.server).emit('typing', {
      username: socket.username
    });
  });

  // When the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    // socket.to(socket.server).emit('stop typing', {
    //   username: socket.username
    // });
    io.in(socket.server).emit('stop typing', {
      username: socket.username
    });
  });

  // When the client emits 'switch server', we switch their server
  socket.on('switch server', (server) => {
    if (typeof server == 'undefined') {
      socket.emit('server switch denied', {
        serverSwitchDeniedReason: 'Invalid server specified.'
      });
      return;
    }
    // Remove the user from their old server
    socket.leave(socket.server);
    // Remove the user from the user list
    userListContents[socket.server] = arrayRemove(userListContents[socket.server], socket.username);
    // Echo globally in the server that this user has left
    socket.to(socket.server).emit('user left', {
      username: socket.username
    });
    // Change the user's server to the requested server
    socket.server = server;
    // Join the user to their requested server
    socket.join(socket.server);
    // Tell the client that the server switch request has succeeded
    socket.emit('server switch success', {
      server: socket.server
    });
    // Echo to the server that a person has connected
    socket.to(socket.server).emit('user joined', {
      username: socket.username,
    });
    // Create the user list contents for the server if it doesn't exist
    if (typeof userListContents[socket.server] == 'undefined') {
      userListContents[socket.server] = [];
    }
    // Add the user to the user list contents for their server
    userListContents[socket.server].push(socket.username);
    // Send the user list contents to the user for their server
    socket.emit('user list', {
      userListContents: userListContents[socket.server]
    });
    socket.emit('switched server', server);
  });

  // When the user disconnects, perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      // Remove the user from the user list
      userListContents[socket.server] = arrayRemove(userListContents[socket.server], socket.username);
      // Echo globally in the server that this user has left
      socket.to(socket.server).emit('user left', {
        username: socket.username
      });
      // Echo globally in the server that the user has stopped typing, since they left
      socket.to(socket.server).emit('stop typing', {
        username: socket.username
      });
      // Remove the username to socket id map entry for the user
      userMap.delete(socket.username);
    }
  });
});

// All systems go!
console.log('HyperChat running!');
