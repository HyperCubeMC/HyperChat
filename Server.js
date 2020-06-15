// At the start, import the needed modules
import fs from 'fs';
import http2 from 'http2';
import socketio from 'socket.io';
import mongoose from 'mongoose';
import handleRequest from './server/webserver/RequestHandler.js';
import handleLogin from './server/socket/events/Login.js';
import handleMessage from './server/socket/events/Message.js';
import handleTyping from './server/socket/events/Typing.js';
import handleStopTyping from './server/socket/events/StopTyping.js';
import handleSwitchServer from './server/socket/events/SwitchServer.js';
import handleDisconnect from './server/socket/events/Disconnect.js';

// Set the process title
process.title = 'HyperChat';

// Options for the web server including the TLS Certificate and allowing http1
const options = {
  cert: fs.readFileSync('/Users/evere/Servers/Certificates/ECDSA/chain.pem'),
  key: fs.readFileSync('/Users/evere/Servers/Certificates/ECDSA/key.pem'),
  allowHTTP1: true
}

// Use http2 to create a secure http2 web server, handled with handleRequest(),
// defined as webServer
const webServer = http2.createSecureServer(options, handleRequest);
// Define io as socketio with our web server
const io = socketio(webServer);

// Make the web server listen on this port
webServer.listen(4434);

// In the beginning, there was the chat app code...

// Setup the muted list as a shared global variable
global.mutedList = [];

// Setup the user list contents as a shared global variable
global.userListContents = [];

// Setup the user list contents as a shared global variable
global.serverListContents = [];

// Define the shared global user map which is used to map usernames to unique socket id's
global.userMap = new Map();

// Connect to the MongoDB database using Mongoose
mongoose.connect('mongodb://localhost:27017/hyperchat', {useNewUrlParser: true, useUnifiedTopology: true}).then(function(db) {
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
  message: String,
  server: String,
  badge: String,
  special: {type: Boolean, required: false},
  usernameColor: {type: String, required: false},
  badgeColor: {type: String, required: false},
  timestamp: {type: Date, default: Date.now}
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

// And everything starts here where a user makes a connection to the socket.io server...
io.on('connection', (socket) => {
  socket.addedUser = false;

  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, server }) => {
    handleLogin({io, socket, username, password, server});
  });

  // When the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    handleMessage({io, socket, message});
  });

  // When the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    handleTyping({io, socket});
  });

  // When the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    handleStopTyping({io, socket});
  });

  // When the client emits 'switch server', we switch their server
  socket.on('switch server', (server) => {
    handleSwitchServer({io, socket, server});
  });

  // When the user disconnects, perform this
  socket.on('disconnect', () => {
    handleDisconnect({io, socket});
  });
});

// All systems go!
console.log('HyperChat running!');
