// At the start, import the needed modules
import fs from 'fs';
import http2 from 'http2';
import { Server as SocketIOServer } from 'socket.io';
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
import handleRequestMoreMessages from './server/socket/event_handlers/RequestMoreMessages.js';
import handleAddServer from './server/socket/event_handlers/AddServer.js';
import handleRemoveServer from './server/socket/event_handlers/RemoveServer.js';
import handleRequestLinkPreview from './server/socket/event_handlers/RequestLinkPreview.js';
import handleAddReaction from './server/socket/event_handlers/AddReaction.js';
import handleRemoveReaction from './server/socket/event_handlers/RemoveReaction.js';
import ArrayMap from './server/util/ArrayMap.js';

// Finish importing rate-limiter flexible
const { RateLimiterMemory } = rateLimiterFlexible;

// Set the process title
process.title = 'HyperChat';

// Setup dotenv
dotenv.config();

// Options for the web server including the TLS Certificate, allowing http1, and the origins we can handle
const options = {
  cert: fs.readFileSync(process.env.CERT_PATH),
  key: fs.readFileSync(process.env.KEY_PATH),
  origins: ['https://hyperchat.dev'],
  allowHTTP1: true
}

// Use http2 to create a secure http2 web server, handled with handleRequest(),
// defined as webServer
const webServer = http2.createSecureServer(options, handleRequest);

// Define io as socketio with our web server
const io = new SocketIOServer(webServer);

// Make the web server listen on this port
webServer.listen(process.env.PORT);

// In the beginning, there was the chat app code...

// Setup the muted list as a shared global variable
global.mutedList = [];

// Setup the muted ip list as a shared global variable
global.mutedIpList = [];

// Setup the muted list as a shared global variable
global.bannedList = [];

// Setup the muted ip list as a shared global variable
global.bannedIpList = [];

// Setup the user list contents as a shared global variable
global.userListContents = [];

// Define the global user ArrayMap which is used to map usernames to an array of unique socket ids connected
global.userConnectionsMap = new ArrayMap();

//Setup the /lock command variable
global.isLoginLocked = false;

// Get the mongodb connection string from dotenv
const mongodbConnectionUri = process.env.MONGODB_CONNECTION_URI;

// Connect to the MongoDB database using Mongoose - tlsInsecure is used since the connection uri uses localhost
mongoose.connect(mongodbConnectionUri, {tlsInsecure: true}).then(function(db) {
  console.log('Connection to MongoDB successful!');
}).catch(function(error) {
  console.error(`Connection error upon trying to connect to MongoDB: ${error}`);
});

// Set the shared global db that refers to the connection to the database
global.db = mongoose.connection;

// Assign Mongoose Schema to Schema
const Schema = mongoose.Schema;
// Create a new Schema for users
const userSchema = new Schema({
  username: String,
  hashedPassword: String,
  serverList: {type: Array, default: [{ServerName: 'General', ServerOwner: 'TODO'}]},
  statusMessage: {type: String, default: ''}
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
  badgeColor: {type: String, required: false},
  reactions: {type: Array, default: []},
  isWhisper: {type: Boolean, required: false}
});

// Create a new schema for servers
const serverSchema = new Schema({
  serverName: String,
  serverOwner: String,
  timestamp: {type: Date, default: Date.now}
});

// Use the user Schema to make a Mongoose Model as a shared global variable
global.userModel = mongoose.model('userModel', userSchema, 'users');

// Use the message Schema to make a Mongoose Model as a shared global variable
global.messageModel = mongoose.model('messageModel', messageSchema, 'messages');

// Use the server Schema to make a Mongoose Model as a shared global variable
global.serverModel = mongoose.model('serverModel', serverSchema, 'servers');

// Setup rate limiters
const messageRateLimiter = new RateLimiterMemory({
    points: 3, // for standard users 3 points
    duration: 5 // per 5 seconds
});

const loginRateLimiter = new RateLimiterMemory({
  points: 3, // 3 points
  duration: 5 // per 5 seconds
});

// Define a new array of strings of admin usernames
export const admins = ["justsnoopy30", "nolski", "pixxi"];

// And everything starts here where a user makes a connection to the socket.io server...
io.on('connection', (socket) => {
  socket.authenticated = false;
  // When the client emits 'login', this listens and executes
  socket.on('login', ({ username, password, server }) => {
    // loginRateLimiter.consume(socket.handshake.headers['cf-connecting-ip'] || socket.handshake.address)
    loginRateLimiter.consume(username)
      .then(rateLimiterRes => {
        handleLogin({io, socket, username, password, server});
      })
      .catch(rej => {
        console.log(`Rejected login for ${username} due to rate limiting: ${rej}`);
        handleLogin({io, socket, username, password, server});
        socket.emit('login denied', {loginDeniedReason: 'You are logging in too fast! Try again in a few seconds.'});
        socket.disconnect();
      });
  });

  // When the client emits 'new message', this listens and executes
  socket.on('new message', (message) => {
    if (!socket.authenticated) return;
    messageRateLimiter.consume(socket.username)
      .then(rateLimiterRes => {
        handleMessage({io, socket, message});
      })
      .catch(rej => {
        console.log(`Kicked ${socket.username} for spamming: ${rej}`);
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

  // When the client emits 'request more messages', give them more messages
  socket.on('request more messages', (skipMessages) => {
    if (!socket.authenticated) return;
    handleRequestMoreMessages({io, socket, skipMessages});
  });

  // When the client emits 'add server', add the server to their server list
  socket.on('add server', (serverName) => {
    if (!socket.authenticated) return;
    handleAddServer({io, socket, serverName});
  });

  // When the client emits 'remove server', remove the server from their server list
  socket.on('remove server', (serverName) => {
    if (!socket.authenticated) return;
    handleRemoveServer({io, socket, serverName});
  });

  // When the client emits 'request link preview', fetch a link preview for the link and send it back
  socket.on('request link preview', (messageId, link) => {
    if (!socket.authenticated) return;
    handleRequestLinkPreview({io, socket, messageId, link});
  });

  // When the client emits 'add reaction', add a reaction to the message denoted by the messageId provided
  socket.on('add reaction', ({ messageId, emojiURL, unicodeFallback }) => {
    if (!socket.authenticated) return;
    handleAddReaction({io, socket, messageId, emojiURL, unicodeFallback});
  });

  // When the client emits 'remove reaction', remove a reaction from the message denoted by the messageId provided
  socket.on('remove reaction', ({ messageId, emojiURL, unicodeFallback }) => {
    if (!socket.authenticated) return;
    handleRemoveReaction({io, socket, messageId, emojiURL, unicodeFallback});
  });

  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
  });

  // When the user disconnects, perform this
  socket.on('disconnect', () => {
    handleDisconnect({io, socket});
  });
});

// All systems go!
console.log('HyperChat running!');
