const url = require('url');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Filter = require('bad-words'),
    filter = new Filter();
const showdown = require('showdown');
const xssFilter = require('showdown-xss-filter');
const argon2 = require('argon2');

// Set process title
process.title = "HyperChat";

// Options for SSL certificate and allowing http1
const options = {
  cert: fs.readFileSync('/Users/evere/Servers/Certificates/chain.pem'),
  key: fs.readFileSync('/Users/evere/Servers/Certificates/key.pem'),
  allowHTTP1: true
}

var app = require('http2').createSecureServer(options, server);
var io = require('socket.io')(app);

app.listen(4434);

function server (req, res) {
  var filePath = '.' + req.url;
  if (filePath == './')
    filePath = './chat.html';

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '': 'text/html',
    '.7z': 'application/x-7z-compressed',
    '.aac': 'audio/aac',
    '.abw': 'application/x-abiword',
    '.arc': 'application/x-freearc',
    '.avi': 'video/x-msvideo',
    '.azw': 'application/vnd.amazon.ebook',
    '.bin': 'application/octet-stream',
    '.bmp': 'image/bmp',
    '.bz': 'application/x-bzip',
    '.bz2': 'application/x-bzip2',
    '.csh': 'application/x-csh',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.eot': 'application/vnd.ms-fontobject',
    '.epub': 'application/epub+zip',
    '.gif': 'image/gif',
    '.gz': 'application/gzip',
    '.htm': 'text/html',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.ics': 'text/calendar',
    '.jar': 'application/java-archive',
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
    '.mpkg': 'application/vnd.apple.installer+xml',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.oga': 'audio/ogg',
    '.ogg': 'application/ogg',
    '.ogv': 'video/ogg',
    '.ogx': 'application/ogg',
    '.opus': 'audio/opus',
    '.otf': 'font/otf',
    '.pdf': 'application/pdf',
    '.php': 'application/php',
    '.png': 'image/png',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/vnd.rar',
    '.rtf': 'application/rtf',
    '.sfnt': 'font/sfnt',
    '.sh': 'application/x-sh' ,
    '.svg': 'image/svg+xml',
    '.tar': 'application/x-tar',
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
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xml': 'application/xml',
    '.xul': 'application/vnd.mozilla.xul+xml',
    '.zip': 'application/zip'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == 'ENOENT') {
        fs.readFile('./errors/404.html', function (error, content) {
          res.writeHead(404, {
            'Content-Type': 'text/html'
          });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Error: ' + error.code + '\nSomething went wrong.');
        res.end();
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType
      });
      res.end(content, 'utf-8');
    }
  });
}


// Chat

function arrayRemove(array, value) {
  return array.filter(function(ele) {
    return ele != value;
  });
}

var userListContents = [];
var mutedList = [];

const prefix = '/';
const userMap = new Map();

mongoose.connect('mongodb://localhost:27017/hyperchat', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.log.bind(console, "Connection error upon trying to connect to MongoDB!"));
db.once('open', function(callback) {
  console.log("Connection to MongoDB successful!");
})

io.on('connection', (socket) => {
  var addedUser = false;

  // When the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    if (typeof message !== 'string' || message == null) return;
    if (mutedList.includes(socket.username)) return;
    const converter = new showdown.Converter({extensions: [xssFilter], tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, backslashEscapesHTMLTags: true, ghMentions: true});
    if (message.length <= 2000) {
      message = filter.clean(message);
      let messageHtml = converter.makeHtml(message);
      io.in(socket.room).emit('new message', {
        username: socket.username,
        message: messageHtml
      });
    }
    else if (message.length > 2000) {
      io.in(socket.room).emit('new message', {
        username: socket.username,
        message: 'This message was removed because it was too long (over 2000 characters).'
      });
      return;
    }
    const args = message.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (socket.username == 'Justsnoopy30') {
      switch (command) {
        case 'mute':
          const mutePerson = args.join(" ");
          mutedList.push(mutePerson);
          io.to(userMap.get(mutePerson)).emit('mute');
          break;
        case 'unmute':
          const unmutePerson = args.join(" ");
          mutedList = arrayRemove(mutedList, unmutePerson);
          io.to(userMap.get(unmutePerson)).emit('unmute');
          break;
        case 'flip':
          const flipPerson = args.join(" ");
          io.to(userMap.get(flipPerson)).emit('flip');
          break;
        case 'unflip':
          const unflipPerson = args.join(" ");
          io.to(userMap.get(unflipPerson)).emit('unflip');
          break;
        case 'stupidify':
          const stupidifyPerson = args.join(" ");
          io.to(userMap.get(stupidifyPerson)).emit('stupidify');
          break;
        case 'smash':
          const smashPerson = args.join(" ");
          io.to(userMap.get(smashPerson)).emit('smash');
          break;
        case 'kick':
          const kickPerson = args.join(" ");
          io.to(userMap.get(kickPerson)).emit('kick');
          io.sockets.sockets[userMap.get(kickPerson)].disconnect();
          break;
        case 'stun':
          const stunPerson = args.join(" ");
          io.to(userMap.get(stunPerson)).emit('stun');
          break;
        default:
          break;
      }
    }
  });

  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, room }) => {
    if (addedUser) return;

    if (typeof username == 'undefined' || typeof password == 'undefined' || typeof room == 'undefined') {
      socket.emit('login denied', {
        loginDeniedReason: "Invalid login request."
      });
      return;
    }
    // Store login info in the local session
    socket.username = username;
    socket.password = password;
    socket.room = room;
    var userHashedPassword;

    if (socket.username.length <= 14 && socket.password.length <= 14 && socket.room.length <= 14 && socket.username.length > 0 && socket.password.length > 0 && socket.room.length > 0) {
      const hashPassword = async (password) => {
        try {
          const hashedPassword = await argon2.hash(password);
          return hashedPassword;
        }
        catch (err) {
          console.error("ERROR: Cannot hash password: " + err);
        }
      }

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
          console.error('ERROR: Cannot verify password: ' + err);
        }
      }

      hashPassword(socket.password).then(hashedPassword => {
        userHashedPassword = hashedPassword;
        verifyLogin();
      });

      function verifyLogin() {
        db.collection('credentials').countDocuments({username: socket.username.toLowerCase(), hashedPassword: {$exists: true}}, function(err, count) {
          var credentials = {
            'username': socket.username.toLowerCase(),
            'hashedPassword': userHashedPassword
          }

          if (err) throw err;
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
          else {
            db.collection('credentials').insertOne(credentials, function(err, collection) {
              if (err) throw err;
              allowLogin();
            });
          }
        });
        const allowLogin = function() {
          socket.join(socket.room);

          socket.emit('login authorized');
          addedUser = true;
          // Echo to the room that a person has connected
          socket.to(socket.room).emit('user joined', {
            username: socket.username,
          });
          if (typeof userListContents[socket.room] == 'undefined') {
            userListContents[socket.room] = [];
          }
          userListContents[socket.room].push(socket.username);
          socket.emit('user list', {
            userListContents: userListContents[socket.room]
          });
          userMap.set(socket.username, socket.id);
        }
      }
    }
    else if (socket.username.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Username cannot be longer than 14 characters'
      });
    }
    else if (socket.password.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Password cannot be longer than 14 characters'
      });
    }
    else if (socket.room.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: 'Room cannot be longer than 14 characters'
      });
    }
    else if (socket.username.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Username cannot be empty'
      });
    }
    else if (socket.password.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Password cannot be empty'
      });
    }
    else if (socket.room.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: 'Room cannot be empty'
      });
    }
    console.log(username + ' joined room: ' + socket.room);
  });

  // When the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    // socket.to(socket.room).emit('typing', {
    //   username: socket.username
    // });
    io.in(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // When the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    // socket.to(socket.room).emit('stop typing', {
    //   username: socket.username
    // });
    io.in(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  // When the user disconnects, perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      userListContents[socket.room] = arrayRemove(userListContents[socket.room], socket.username);
      // Echo globally that this client has left
      socket.to(socket.room).emit('user left', {
        username: socket.username
      });
      socket.to(socket.room).emit('stop typing', {
        username: socket.username
      });
      userMap.delete(socket.username);
    }
  });
});

console.log('HyperChat running!');
