/**
 * Module to handle the socket message event.
 * @module Socket Message Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

// At the start, import the needed modules
import marked from 'marked';
import sanitizeHtml from 'sanitize-html';
import wordFilter from 'whoolso-word-filter';
import { wordsToFilter, lengthThreshold, leetAlphabet1, leetAlphabet2, shortWordLength, shortWordExceptions } from '../../util/FilterConstants.js';

const { filterWords } = wordFilter;

// Set the message command prefix
const prefix = '/';

// Define a new array of objects of special users
let specialUsers = [];

// Set marked options
marked.setOptions({
  gfm: true
});

// Set sanitizeHtmlOptions for sanitize-html
const sanitizeHtmlOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    img: [
      'src', 'srcset', 'draggable', 'alt', 'class', 'crossorigin'
    ],
    span: ['style', 'class']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/]
    }
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data'],
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', {target: '_blank'})
  }
}

// Put the special users with details in the special user array
specialUsers.push({Username: 'justsnoopy30', Badge: 'Owner', UsernameColor: '#00b0f4', BadgeColor: '#7289da'}, {Username: 'kmisterk', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#691785'},{Username: 'OliviaTheVampire', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#7b3c96'},{Username: 'nbi__', Badge: 'Admin', UsernameColor: '#79f02e', BadgeColor: '#79f02e'}, {Username: '4a656666', Badge: 'Admin', UsernameColor: '#9c59b6', BadgeColor: '#79f02e'},{Username: 'pixxi', Badge: 'Bonk Head', UsernameColor: '#ff9ff2', BadgeColor: '#ff9ff2'});

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
  // Trim extra break tags before validating
  message = message.replace(/\s*(<br ?\/>\s*)+/g, "<br>").replace(/^<br>|<br>$/g, "");
  // Stop right there if the user tries to send a invalid message (null, non-string, or empty message)
  if (!validateMessage(message)) return;
  // If the muted list or muted ip list includes the user trying to send the message, stop right there
  if (global.mutedList.includes(socket.username)) return;
  if (global.mutedIpList.includes(socket.handshake.address)) return;
  // Check if the message is over 100000 characters, and if it is, change it to a
  // ...predetermined message indicating that the message is too long and return
  if (message.length > 100000) {
    message = 'This message was removed because it was too long (over 100000 characters).';
  }

  // Make mentions text fancier
  global.userListContents[socket.server].forEach(username => {
    message = message.replaceAll(`@${username}`, `<span class="mention-text">@${username}</span>`)
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

  // Check the message for bad words
  const filterFoundWords = filterWords(filterOptions);
  if (filterFoundWords.length != 0) {
    console.log(`User ${socket.username} tried to swear with: ${filterFoundWords}`);
    message = 'not good';
  }

  // Convert markdown to html with the Marked markdown library
  const messageHtml = marked(message);

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
      message: 'The user specified in the command is not in the room.',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'The user specified in the command is not in the room.',
      server: socket.server,
      timestamp: timestamp,
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
      message: 'Access Denied.',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'Access Denied.',
      server: socket.server,
      timestamp: timestamp,
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
      message: 'Invalid command.',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'Invalid command.',
      server: socket.server,
      timestamp: timestamp,
      badge: 'Server'
    });
    // Add a new message to the database
    messageDocument.save(function (err, message) {
      if (err) console.error(err);
    });
  }

  // Special admin commands
  switch (command) {
    case 'mute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToMute = commandArgument;
      global.mutedList.push(userToMute);
      io.to(global.userMap.get(userToMute)).emit('mute');
      break;
    }
    case 'unmute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnmute = commandArgument;
      global.mutedList = global.arrayRemove(global.mutedList, userToUnmute);
      io.to(global.userMap.get(userToUnmute)).emit('unmute');
      break;
    }
    case 'ipmute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      const ipToMute = commandArgument;
      global.mutedIpList.push(ipToMute);
      io.sockets.sockets.forEach((connectedSocket) => {
        const username = connectedSocket.username;
        console.log(`Ip to mute: ${ipToMute} | Handshake address: ${connectedSocket.handshake.address}`);
        if (connectedSocket.handshake.address === ipToMute && global.userMap.has(username)) {
          io.to(global.userMap.get(username)).emit('mute');
        }
      });
      break;
    }
    case 'unmuteip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      const ipToUnmute = commandArgument;
      global.mutedIpList = global.arrayRemove(global.mutedIpList, ipToUnmute);
      io.sockets.sockets.forEach((connectedSocket) => {
        const username = connectedSocket.username;
        console.log(`Ip to unmute: ${ipUnToMute} | Handshake address: ${connectedSocket.handshake.address}`);
        if (connectedSocket.handshake.address === ipToUnmute && global.userMap.has(username)) {
          io.to(global.userMap.get(username)).emit('unmute');
        }
      });
      break;
    }
    case 'flip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToFlip = commandArgument;
      io.to(global.userMap.get(userToFlip)).emit('flip');
      break;
    }
    case 'unflip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnflip = commandArgument;
      io.to(global.userMap.get(userToUnflip)).emit('unflip');
      break;
    }
    case 'stupidify': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToStupidify = commandArgument;
      io.to(global.userMap.get(userToStupidify)).emit('stupidify');
      break;
    }
    case 'smash': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToSmash = commandArgument;
      io.to(global.userMap.get(userToSmash)).emit('smash');
      break;
    }
    case 'unsmash': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnsmash = commandArgument;
      io.to(global.userMap.get(userToUnsmash)).emit('unsmash');
      break;
    }
    case 'kick': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToKick = commandArgument;
      io.to(global.userMap.get(userToKick)).emit('kick');
      io.sockets.sockets[global.userMap.get(userToKick)].disconnect();
      break;
    }
    case 'stun': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!global.userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToStun = commandArgument;
      io.to(global.userMap.get(userToStun)).emit('stun');
      break;
    }
    default: {
      invalidCommand();
      break;
    }
  }
}

// Export the handleMessage function as the default export
export default handleMessage;
