const url = require('url')
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose');
const Filter = require('bad-words'),
    filter = new Filter();
const compress = require("compression");
const showdown = require('showdown');
const xssFilter = require('showdown-xss-filter');
const argon2 = require('argon2');

	// options for SSL certificate
const options = {
	cert: fs.readFileSync('/Users/evere/Servers/Certificates/chain.pem'),
	key: fs.readFileSync('/Users/evere/Servers/Certificates/key.pem'),
}

var app = require('https').createServer(options, server);
var io = require('socket.io')(app);

app.listen(4434);

function server (req, res) {
  var defaultCompressOptions = function(){}, useDefaultOptions = {}
  compress(useDefaultOptions)(req,res,defaultCompressOptions) // Mutates the response object to add compression

	var filePath = '.' + req.url;
	if (filePath == './')
		filePath = './chat.html';

	var extname = String(path.extname(filePath)).toLowerCase();
	var mimeTypes = {
		'': 'text/html',
		'.txt': 'text/plain',
		'.html': 'text/html',
		'.mhtml': 'message/rfc822',
		'.js': 'application/javascript',
		'.mjs': 'text/javascript',
		'.css': 'text/css',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.gif': 'image/gif',
		'.wav': 'audio/wav',
		'.mp3': 'audio/mp3',
		'.mp4': 'video/mp4',
		'.woff': 'application/font-woff',
		'.ttf': 'application/font-ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.otf': 'application/font-otf',
		'.svg': 'image/svg+xml',
		'.ico': 'image/x-icon',
		'.pdf': 'application/pdf'
	};

	var contentType = mimeTypes[extname] || 'application/octet-stream';

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
				res.end('Error: ' + error.code + '          Something went wrong.\n');
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

var userListContents = [];
function arrayRemove(arr, value) {

   return arr.filter(function(ele){
       return ele != value;
   });

}

var mutedList = []
var isMuted;

mongoose.connect('mongodb://localhost:27017/hyperchat', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.log.bind(console, "Connection error upon trying to connect to MongoDB!"));
db.once('open', function(callback) {
  console.log("Connection to MongoDB successful!");
})

var prefix = '/';

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    if (typeof message !== 'string' || message == null) return;
    const converter = new showdown.Converter({extensions: [xssFilter], tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, backslashEscapesHTMLTags: true, ghMentions: true});
		isMuted = false;
		if (mutedList.includes(socket.username)) {
		  isMuted = true
		}
		if (message.length <= 2000 && !isMuted) {
      message = filter.clean(message);
      messageHtml = converter.makeHtml(message);
			io.in(socket.room).emit('new message', {
	      username: socket.username,
	      message: messageHtml
	    });
		}
		else if (message.length > 2000 && !isMuted) {
			io.in(socket.room).emit('new message', {
	      username: socket.username,
	      message: "This message was removed because it was too long (over 2000 characters)."
	    });
      return;
		}
		else if (isMuted) {
			socket.emit('muted');
		}
		const args = message.slice(prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		if (command == "mute" && socket.username == "Justsnoopy30") {
		  const mute_person = args.join(" ");
		  mutedList.push(mute_person);
		}
		if (command == "unmute" && socket.username == "Justsnoopy30") {
		  const unmute_person = args.join(" ");
		  mutedList = arrayRemove(mutedList, unmute_person);
		}
		if (command == "flip" && socket.username == "Justsnoopy30") {
			const flip_person = args.join(" ");
			io.in(socket.room).emit('flip', {
	      affectedUsername: flip_person
	    });
		}
		if (command == "unflip" && socket.username == "Justsnoopy30") {
			const unflip_person = args.join(" ");
			io.in(socket.room).emit('unflip', {
	      affectedUsername: unflip_person
	    });
		}
		if (command == "stupidify" && socket.username == "Justsnoopy30") {
			const stupidify_person = args.join(" ");
			io.in(socket.room).emit('stupidify', {
	      affectedUsername: stupidify_person
	    });
		}
		if (command == "smash" && socket.username == "Justsnoopy30") {
			const smash_person = args.join(" ");
			io.in(socket.room).emit('smash', {
	      affectedUsername: smash_person
	    });
		}
    if (command == "kick" && socket.username == "Justsnoopy30") {
      const kick_person = args.join(" ");
      io.in(socket.room).emit('kick', {
        affectedUsername: kick_person
      });
    }
    if (command == "stun" && socket.username == "Justsnoopy30") {
      const stun_person = args.join(" ");
      io.in(socket.room).emit('stun', {
        affectedUsername: stun_person
      });
    }
  });

  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, room }) => {
    if (addedUser) return;

    if (typeof username == 'undefined' || typeof password == 'undefined' || typeof room == 'undefined') {
      socket.emit('login denied', {
        loginDeniedReason: "Invalid Login Request"
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
          console.error("ERROR: Cannot verify password: " + err);
        }
      }

      hashPassword(socket.password).then(hashedPassword => {
        userHashedPassword = hashedPassword;
        verifyLogin();
      });

      function verifyLogin() {
        db.collection('credentials').countDocuments({username: socket.username, hashedPassword: {$exists: true}}, function(err, count) {
          var credentials = {
            "username": socket.username,
            "hashedPassword": userHashedPassword
          }

          if (err) throw err;
          if (count > 0) {
            db.collection('credentials').findOne({username: socket.username}, function(err, user) {
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
                    loginDeniedReason: "Username already exists/Invalid Password"
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
        var allowLogin = function() {
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
        }
      }
    }
    else if (socket.username.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: "Username cannot be longer than 14 characters"
      });
    }
    else if (socket.password.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: "Password cannot be longer than 14 characters"
      });
    }
    else if (socket.room.length > 14) {
      socket.emit('login denied', {
        loginDeniedReason: "Room cannot be longer than 14 characters"
      });
    }
    else if (socket.username.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: "Username cannot be empty"
      });
    }
    else if (socket.password.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: "Password cannot be empty"
      });
    }
    else if (socket.room.length == 0) {
      socket.emit('login denied', {
        loginDeniedReason: "Room cannot be empty"
      });
    }
    console.log(username + " joined room: " + socket.room);
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

  // When the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
			userListContents[socket.room] = arrayRemove(userListContents[socket.room], socket.username);
      // Echo globally that this client has left
      socket.to(socket.room).emit('user left', {
        username: socket.username
      });
    }
  });
});

console.log('HyperChat running');
