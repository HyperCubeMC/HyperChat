// At the start, import the needed modules
import fs from 'fs';
import http2 from 'http2';
import socketio from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimiterFlexible from 'rate-limiter-flexible';
import handleRequest from './server/webserver/RequestHandler.js';
import handleLogin from './server/socket/event_handlers/Login.js';
import handleMessage from './server/socket/event_handlers/Message.js';
import handleTyping from './server/socket/event_handlers/Typing.js';
import handleStopTyping from './server/socket/event_handlers/StopTyping.js';
import handleSwitchServer from './server/socket/event_handlers/SwitchServer.js';
import handleDisconnect from './server/socket/event_handlers/Disconnect.js';
import handleDeleteMessage from './server/socket/event_handlers/DeleteMessage.js';
import handleUploadProfilePicture from './server/socket/event_handlers/UploadProfilePicture.js';

// Finish importing rate-limiter flexible
const { RateLimiterMemory } = rateLimiterFlexible;

// Set the process title
process.title = 'HyperChat';

// Setup dotenv
dotenv.config();

// Options for the web server including the TLS Certificate and allowing http1
const options = {
  cert: fs.readFileSync(process.env.CERT_PATH),
  key: fs.readFileSync(process.env.KEY_PATH),
  allowHTTP1: true
}

// Use http2 to create a secure http2 web server, handled with handleRequest(),
// defined as webServer
const webServer = http2.createSecureServer(options, handleRequest);
// Define io as socketio with our web server
const io = socketio(webServer);

// Make the web server listen on this port
webServer.listen(process.env.PORT);

// In the beginning, there was the chat app code...

// Setup the muted list as a shared global variable
global.mutedList = [];

// Setup the user list contents as a shared global variable
global.userListContents = [];

// Setup the user list contents as a shared global variable
global.serverListContents = [];

// Helper function to return an array with the value specified removed from the passed array
global.arrayRemove = (array, value) => {
  return array.filter(function(element) {
    return element != value;
  });
}

// Define the shared global user map which is used to map usernames to unique socket id's
global.userMap = new Map();

// Get the mongodb connection string from dotenv
const mongodbConnectionUri = process.env.MONGODB_CONNECTION_URI;

// Connect to the MongoDB database using Mongoose - tlsInsecure is used since the connection uri uses localhost
mongoose.connect(mongodbConnectionUri, {useNewUrlParser: true, useUnifiedTopology: true, tlsInsecure: true}).then(function(db) {
  console.log('Connection to MongoDB successful!');
}).catch(function(error) {
  console.error(`Connection error upon trying to connect to MongoDB: ${error}`);
});

// Set the shared global db that refers to the connection to the database
global.db = mongoose.connection;

// Assign Mongoose Schema to Schema
const Schema = mongoose.Schema;
// Create a new Schema for user credentials
const userCredentialsSchema = new Schema({
  username: String,
  hashedPassword: String
});

// Create a new schema for messages
const messageSchema = new Schema({
  username: String,
  messageId: String,
  message: String,
  server: String,
  timestamp: Date,
  badge: String,
  special: {type: Boolean, required: false},
  usernameColor: {type: String, required: false},
  badgeColor: {type: String, required: false}
});

// Create a new schema for servers
const serverSchema = new Schema({
  serverName: String,
  serverOwner: String,
  timestamp: {type: Date, default: Date.now}
});

// Use the user credentials Schema to make a Mongoose Model as a shared global variable
global.userCredentialsModel = mongoose.model('userCredentialsModel', userCredentialsSchema, 'credentials');

// Use the message Schema to make a Mongoose Model as a shared global variable
global.messageModel = mongoose.model('messageModel', messageSchema, 'messages');

// Use the server Schema to make a Mongoose Model as a shared global variable
global.serverModel = mongoose.model('serverModel', serverSchema, 'servers');

// Setup rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 points
  duration: 1 // per second
});

// And everything starts here where a user makes a connection to the socket.io server...
io.on('connection', (socket) => {
  socket.authenticated = false;

  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, server }) => {
    handleLogin({io, socket, username, password, server});
  });

  // When the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    if (!socket.authenticated) return;
    rateLimiter.consume(socket.username)
      .then(rateLimiterRes => {
        handleMessage({io, socket, message});
      })
      .catch(rej => {
        socket.emit('kick', 'spamming');
        socket.disconnect();
      });
  });

  // When the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    if (!socket.authenticated) return;
    handleTyping({io, socket});
  });

  // When the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    if (!socket.authenticated) return;
    handleStopTyping({io, socket});
  });

  // When the client emits 'switch server', we switch their server
  socket.on('switch server', (server) => {
    if (!socket.authenticated) return;
    handleSwitchServer({io, socket, server});
  });

  // When the client emits 'delete message', we try to delete the message requested
  socket.on('delete message', (messageId) => {
    if (!socket.authenticated) return;
    handleDeleteMessage({io, socket, messageId});
  });

  // When the client emits 'upload profile picture', save their new profile picture
  socket.on('upload profile picture', async (profilePicture) => {
    if (!socket.authenticated) return;
    await handleUploadProfilePicture({io, socket, profilePicture});
  });

  // When the user disconnects, perform this
  socket.on('disconnect', () => {
    handleDisconnect({io, socket});
  });
});

// All systems go!
console.log('HyperChat running!');
