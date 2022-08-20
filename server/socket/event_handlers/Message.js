/**
 * Module to handle the socket message event.
 * @module Socket Message Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

// At the start, import the needed modules
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import wordFilter from 'whoolso-word-filter';
import { wordsToFilter, lengthThreshold, leetAlphabet1, leetAlphabet2, shortWordLength, shortWordExceptions } from '../../util/FilterConstants.js';
import setStatusMessage from './SetStatusMessage.js';
import arrayRemove from '../../util/ArrayRemove.js';
import { admins } from '../../../Server.js';

const { filterWords } = wordFilter;

// Set the message command prefix
const prefix = '/';

// Define a new array of objects of special users
const specialUsers = [{Username: 'justsnoopy30', Badge: 'Owner', UsernameColor: '#00b0f4', BadgeColor: '#7289da'}, {Username: 'kmisterk', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#691785'},{Username: 'OliviaTheVampire', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#7b3c96'},{Username: 'nbi__', Badge: 'Admin', UsernameColor: '#79f02e', BadgeColor: '#79f02e'}, {Username: '4a656666', Badge: 'Admin', UsernameColor: '#9c59b6', BadgeColor: '#79f02e'}, {Username: 'pixxi', Badge: 'Bonk Head', UsernameColor: '#ff9ff2', BadgeColor: '#ff9ff2'}, {Username: 'nolski', Badge: 'Cool', UsernameColor: '#c22f62', BadgeColor: '#c22f62'}, {Username: 'idkmyusername', Badge: 'Funny User', UsernameColor: '#bd1122', BadgeColor: '#bd1122'}, {Username: 'not good', Badge: 'not good'}, {Username: 'freshtomato', UsernameColor: '#42eff5', Badge: 'Short Stack', BadgeColor: '#42eff5'}, {Username: 'rapids', UsernameColor: '#24a4a2', Badge: 'Platypus', BadgeColor: '#24a4a2'}, {Username: 'titanportal', Badge: 'Titan', BadgeColor: '#a575ff', UsernameColor: '#a575ff'}, {Username: 'wardaaaaaaan', Badge: 'Cheese', BadgeColor: '#e8f00e', UsernameColor: '#e8f00e'}, {Username: 'ectopicsmile', Badge: 'broski', BadgeColor: '#09772f', UsernameColor: '#09772f'}, {Username: 'holy smokes', Badge: 'annoying'}, {Username: 'microsoftexel', Badge: 'fish'}, {Username: 'holysmokes', Badge: 'weirdo'}, {Username: 'neil', Badge: 'pog legend', UsernameColor: '#ff0000', BadgeColor: '#ff7300'}, {Username: 'leoruxu', Badge: 'rui stan', UsernameColor: '#967bb6', BadgeColor: '#967bb6'}, {Username: 'conner', Badge: 'kaneki', UsernameColor: '#3489eb', BadgeColor: '#3489eb'}, {Username: 'isa', Badge: 'gymbro', UsernameColor: '#1002b0', BadgeColor: '#1002b0'}];

// Set marked options
marked.setOptions({
  gfm: true
});

// Set sanitizeHtmlOptions for sanitize-html
const sanitizeHtmlOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'marquee', 'blink', 'del' ]),
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    img: [
      'src', 'srcset', 'draggable', 'alt', 'class', 'crossorigin'
    ],
    span: ['style', 'class'],
    marquee: ['direction', 'behavior']
    // iframe: ['src', 'height', 'width']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/],
      'font-family': [/^[a-zA-Z_\-,"' -]+$/] // TODO: FIXME - DOES NOT WORK
    },
    'p': {
      'font-size': [/^\d+rem$/]
    }
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data'],
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', {target: '_blank'})
  }
  // allowedIframeHostnames: ['hyperchat.dev']
}

// Helper function to validate the contents of a message
function validateMessage(message) {
  return (message !== null && typeof message == 'string' && message.length !== 0 && message.trim());
}

// Utility function to help with generating random numeric strings, see https://stackoverflow.com/a/57355127
function generateNumericRandom(n) { var add = 1, max = 12 - add; if (n > max) { return generateNumericRandom(max) + generateNumericRandom(n - max); } max = Math.pow(10, n + add); var min = max / 10; var number = Math.floor(Math.random() * (max - min + 1)) + min; return ("" + number).substring(add); }

// Tiny wrapper function to generate a message id
function generateMessageId() {
  return generateNumericRandom(18);
}

function handleMessage({io, socket, message}) {
  // Stop right there if the user tries to send a invalid message (null, non-string, or empty message)
  if (!validateMessage(message)) return;
  // If the muted list or muted ip list includes the user trying to send the message, stop right there
  if (global.mutedList.includes(socket.username)) return;
  if (global.mutedIpList.includes(socket.handshake.headers['cf-connecting-ip'] || socket.handshake.address)) return;

  // TODO: Implement proper image uploading and remove this include check that prevents images from getting detected by the filter or blocked by the character limit
  const messageContainsImage = message.includes('<img');

  // Check if the message is over 10000 characters, and if it is, change it to a
  // ...predetermined message indicating that the message is too long and return
  if (message.length > 10000 && !(messageContainsImage && message.length < 5000000)) {
    message = 'This message was removed because it was too long (over 10000 characters).';
  }
  // Make mentions text fancier
  global.userListContents[socket.server].forEach(user => {
    message = message.replaceAll(`@${user.username}`, `<span class="mention-text">@${user.username}</span>`)
  });
  const filterOptions = {
    wordsToFilter: wordsToFilter,
    stringToCheck: message,
    lengthThreshold: lengthThreshold,
    leetAlphabet1: leetAlphabet1,
    leetAlphabet2: leetAlphabet2,
    shortWordLength: shortWordLength,
    shortWordExceptions: shortWordExceptions
  }
  
  const profanityReplacementArray = ['!@#$&?%', '\\*\\*\\*\\*', 'not good', 'Stop', 'No No, Bad Word', 'I like Fortnite', 'Sometimes I like to go outside and throw a rake at my neighbors dog'];
  
  // Check the message for bad words
  const filterFoundWords = filterWords(filterOptions);
  if (filterFoundWords.length != 0 && !message.includes('<img')) {
    console.log(`User ${socket.username} tried to swear with: ${filterFoundWords}`);
    
    message = profanityReplacementArray[Math.floor(Math.random() * profanityReplacementArray.length)];
  }

  // Convert markdown to html with the Marked markdown library, trim trailing whitespace and newlines
  const messageHtml = marked(message).trim().replace(/^\s+|\s+$/g, '');

  // Sanitize the message html with the sanitize-html library
  const finalMessage = sanitizeHtml(messageHtml, sanitizeHtmlOptions);

  // Perform special user checking and then send the final message to everyone in the user's server
  const specialUser = specialUsers.find(specialUser => specialUser.Username === socket.username.toLowerCase());

  // Generate a random numeric message id and save it to a variable
  const messageId = generateMessageId();

  // Make a timestamp for the message
  const timestamp = Date.now();

  if (specialUser) {
    io.in(socket.server).emit('new message', {
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      timestamp: timestamp,
      special: true,
      badge: specialUser.Badge,
      usernameColor: specialUser.UsernameColor,
      badgeColor: specialUser.BadgeColor
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      server: socket.server,
      timestamp: timestamp,
      special: true,
      badge: specialUser.Badge,
      usernameColor: specialUser.UsernameColor,
      badgeColor: specialUser.BadgeColor
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }
  else {
    io.in(socket.server).emit('new message', {
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      timestamp: timestamp,
      badge: 'none'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      server: socket.server,
      timestamp: timestamp,
      badge: 'none'
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }

  // Define commandWithArgumentArray as an empty array to start
  let commandWithArgumentArray = [];
  // Remove the command prefix and get the command and argument as an array with magic split code
  // See https://stackoverflow.com/a/10272828/8584806
  if (message[0] == prefix) {
    // Starts with the command prefix, so remove the prefix and set the commandWithArgumentArray
    // to an array with the command as the first entry, and the argument as the second entry
    commandWithArgumentArray = message.substr(1).split(/(?<=^\S+)\s/);
  }
  else {
    // The message doesn't start with the command prefix, indicating it can't be a command, so return
    return;
  }
  // Get the command
  const command = commandWithArgumentArray[0];
  // Get the argument
  const commandArgument = commandWithArgumentArray[1];
  // Function to send a server message indicating that the user to execute the command on
  // is not in the room, and return
  function commandNonexistingUserSpecified() {
    // Generate a message id
    const messageId = generateMessageId();
    // Make a timestamp for the message
    const timestamp = Date.now();
    // Send the error message
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      messageId: messageId,
      message: 'The user specified in the command is not in the server',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'The user specified in the command is not in the server',
      server: socket.server,
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }

  // Function to send a server message indicating that the user does not have access
  // to the command, and return
  function commandAccessDenied() {
    // Generate a message id
    const messageId = generateMessageId();
    // Make a timestamp for the message
    const timestamp = Date.now();
    // Send the error message
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      messageId: messageId,
      message: 'Access Denied',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'Access Denied',
      server: socket.server,
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }

  // Function to send a server message indicating that the user specified an
  // invalid command, and return
  function invalidCommand() {
    // Generate a message id
    const messageId = generateMessageId();
    // Make a timestamp for the message
    const timestamp = Date.now();
    // Send the error message
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      messageId: messageId,
      message: 'Invalid command',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'Invalid command',
      server: socket.server,
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }

  // Special admin and user commands
  switch (command) {
    case 'status': {
      const statusMessage = commandArgument;
      // Generate a new message id
      const messageId = generateMessageId();
      // Make a timestamp for the message
      const timestamp = Date.now();
      // Check if the status message isn't provided and respond accordingly
      if (statusMessage == null) {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: 'You must specify a status message to set!',
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: 'You must specify a status message to set!',
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        messageDocument.save(function (err, message) {
          if (err) console.error(err);
        });
        return;
      }

      setStatusMessage({io, socket, statusMessage}); // TODO: Move all the rest of this logic into the SetStatusMessage file

      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId: messageId,
        message: 'Status message set!',
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId: messageId,
        message: 'Status message set!',
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });//nooo
      messageDocument.save(function (err, message) {
        if (err) console.error(err);
      });
      break;
    }
    case 'mute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToMute = commandArgument;
      global.mutedList.push(userToMute);
      global.userConnectionsMap.get(userToMute).forEach(socketID => {
        io.to(socketID).emit('mute');
      });
      break;
    }
    case 'unmute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnmute = commandArgument;
      global.mutedList = arrayRemove(global.mutedList, userToUnmute);
      global.userConnectionsMap.get(userToUnmute).forEach(socketID => {
        io.to(socketID).emit('unmute');
      });
      break;
    }
    case 'ipmute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const ipToMute = commandArgument;
      global.mutedIpList.push(ipToMute);
      io.sockets.sockets.forEach(connectedSocket => {
        const connectedSocketIP = connectedSocket.handshake.headers['cf-connecting-ip'] || connectedSocket.handshake.address;
        if (connectedSocketIP === ipToMute) {
          connectedSocket.emit('mute');
        }
      });
      console.log(`Muted IP: ${ipToMute}`);
      break;
    }
    case 'clog': {
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      io.sockets.sockets.forEach(connectedSocket => {
        const connectedSocketIP = connectedSocket.handshake.headers['cf-connecting-ip'] || connectedSocket.handshake.address;
        console.log(`Username: ${connectedSocket.username} IP: ${connectedSocketIP}`);
      });
      break;
    }
    case 'unmuteip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const ipToUnmute = commandArgument;
      global.mutedIpList = arrayRemove(global.mutedIpList, ipToUnmute);
      io.sockets.sockets.forEach(connectedSocket => {
        const connectedSocketIP = connectedSocket.handshake.headers['cf-connecting-ip'] || connectedSocket.handshake.address;
        if (connectedSocketIP === ipToUnmute) {
          connectedSocket.emit('unmute');
        }
      });
      console.log(`Unmuted IP: ${ipToUnmute}`);
      break;
    }
    case 'ipmuteuser': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command on isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const usernameToIpMute = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        const connectedSocketIP = connectedSocket.handshake.headers['cf-connecting-ip'] || connectedSocket.handshake.address;
        if (connectedSocket.username === usernameToIpMute) {
          console.log(`User to IP Mute: ${usernameToIpMute} | Handshake Address: ${connectedSocketIP}`);
          global.mutedIpList.push(connectedSocketIP);
          connectedSocket.emit('mute');
        }
      });
      break;
    }
    case 'unipmuteuser': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command on isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const usernameToUnIpMute = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        const connectedSocketIP = connectedSocket.handshake.headers['cf-connecting-ip'] || connectedSocket.handshake.address;
        if (connectedSocket.username === usernameToUnIpMute) {
          console.log(`User to un-IP Mute: ${usernameToUnIpMute} | Handshake Address: ${connectedSocketIP}`);
          global.mutedIpList.push(connectedSocketIP);
          connectedSocket.emit('unmute');
        }
      });
      break;
    }
    case 'flip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToFlip = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToFlip) {
          connectedSocket.emit('flip');
        }
      });
      break;
    }
    case 'unflip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnflip = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToUnflip) {
          connectedSocket.emit('unflip');
        }
      });
      break;
    }
    case 'smash': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToSmash = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToSmash) {
          connectedSocket.emit('smash');
        }
      });
      break;
    }
    case 'unsmash': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnsmash = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToUnsmash) {
          connectedSocket.emit('unsmash');
        }
      });
      break;
    }
    case 'kick': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToKick = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToKick) {
          connectedSocket.emit('kick');
          connectedSocket.disconnect();
        }
      });
      console.log(`Kicked ${userToKick}`);
      break;
    }
    case 'clear': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const messagesToClear = parseInt(commandArgument);
      // NB: DO NOT REMOVE THIS CONDITION UNDER ANY CIRCUMSTANCES
      if (messagesToClear < 1 || messagesToClear == null || typeof messagesToClear !== 'number' || isNaN(messagesToClear)) {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: 'You must clear more than zero messages',
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: 'You must clear more than zero messages',
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        messageDocument.save(function (err, message) {
          if (err) console.error(err);
        });
        return;
      }
      if (messagesToClear > 20) {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: 'Too many messages to clear at once (> 20 messages)',
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: 'Too many messages to clear at once (> 20 messages)',
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        messageDocument.save(function (err, message) {
          if (err) console.error(err);
        });
        return;
      }
      global.messageModel.find({ server: socket.server }).sort({ timestamp: -1 }).skip(1).limit(messagesToClear).then((messages) => {
        messages.forEach(message => {
          console.log(`Deleting ${message.message} requested by ${socket.username} in a clear of ${messagesToClear} messages`);
          io.in(socket.server).emit('delete message', message.messageId);
          message.remove();
        });
      }).catch((error) => {
        // Catch and show an error in console if there is one
        console.error(`An error occurred while attempting to fetch messages to clear by ${socket.username} in server ${socket.server} from the database: ${error}`);
      });
      break;
    }
    case 'ban': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const userToBan = commandArgument;
      global.bannedList.push(userToBan);
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToBan) {
          connectedSocket.emit('ban');
          connectedSocket.disconnect();
        }
      });

      console.log(`Banned ${userToBan}`);
      break;
    }
    // case 'ipban': {
      
    //   break;
    // }
    case 'unban': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const userToUnBan = commandArgument;
      global.bannedList.splice(bannedList.indexOf(userToUnBan));
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToUnBan) {
          connectedSocket.emit('unban');
        }
      });

      console.log(`Unbanned ${userToUnBan}`);
      break;
    }
    case 'stun': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToStun = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToStun) {
          connectedSocket.emit('stun');
        }
      });
      break;
    }
    case 'open': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].some(user => user.username === commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToOpen = commandArgument;
      io.sockets.sockets.forEach(connectedSocket => {
        if (connectedSocket.username === userToOpen) {
            connectedSocket.emit('open');
        }
      });
      break;
    }
    case 'draw': {
      // Generate a message id
      const messageId = generateMessageId();
      // Make a timestamp for the message
      const timestamp = Date.now();
      // Send the message
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId: messageId,
        message: '/draw is disabled for now',
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });
      // Create the mongoose document for messages using the message model
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId: messageId,
        message: '/draw is disabled for now',
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });
      // Add a new message to the database
      messageDocument.save(function (err, message) {
        if (err) console.error(err);
      });
      break;
      // io.in(socket.server).emit('new message', {
      //   username: 'HyperChat',
      //   messageId: messageId,
      //   message: `<canvas class="whiteboard" id="message-whiteboard-${messageId}"></canvas>`,
      //   timestamp: timestamp,
      //   special: true,
      //   badge: 'Server'
      // });
      // // Create the mongoose document for messages using the message model
      // const messageDocument = new global.messageModel({
      //   username: 'HyperChat',
      //   messageId: messageId,
      //   message: `<canvas class="whiteboard" id="message-whiteboard-${messageId}"></canvas>`,
      //   server: socket.server,
      //   timestamp: timestamp,
      //   special: true,
      //   badge: 'Server'
      // });
      // // Add a new message to the database
      // messageDocument.save(function (err, message) {
      //   if (err) console.error(err);
      // });
      // break;
    }
    default: {
      invalidCommand();
      break;
    }
  }
}

// Export the handleMessage function as the default export
export default handleMessage;
