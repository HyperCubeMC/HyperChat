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
import { ChatGPTUnofficialProxyAPI, ChatGPTAPI } from 'chatgpt';
import { ChatGPTClient, BingAIClient } from '@waylaidwanderer/chatgpt-api';
import dotenv from 'dotenv';

const { filterWords } = wordFilter;

// Setup chat gpt
dotenv.config();

let chatGPTApi = null;
try {
//   chatGPTApi = new ChatGPTAPI({
//     //apiKey: process.env.CHATGPT_API_KEY,
//     apiKey: process.env.CHATGPT_ACCESS_TOKEN,
// //    apiBaseUrl: "https://chat.duti.tech/api",
// //    apiReverseProxyUrl: "https://chatgpt.pawan.krd/api/completions",
// //    apiReverseProxyUrl: "https://chat.duti.tech/api/completions",
// //    apiReverseProxyUrl: "https://chatgpt.hato.ai/completions",
//     completionParams: {
//       model: 'text-davinci-002-render-sha'
//     }
//   });
  // chatGPTApi = new ChatGPTUnofficialProxyAPI({
  //   accessToken: process.env.CHATGPT_ACCESS_TOKEN, // https://chat.openai.com/api/auth/session
  //   apiReverseProxyUrl: "https://bypass.duti.tech/api/conversation"
  // })
  chatGPTApi = new ChatGPTAPI({
    apiKey: process.env.PAWAN_PROXY_KEY,
    apiBaseUrl: "https://gpt.pawan.krd/api",
    // completionParams: {
    //   stop: "[DONE]"
    // },
    debug: true
  });
  // apiReverseProxyUrl: 'https://your-example-server.com/api/conversation'
  // Proxy #1: https://bypass.duti.tech/api/conversation
  // Proxy #2: https://gpt.pawan.krd/backend-api/conversation
} catch (e) {
  console.error("Unable to auth with Chat GPT");
}

// let waylaidChatGPTApi = null;
// try {
//   waylaidChatGPTApi = new ChatGPTClient(process.env.PAWAN_PROXY_KEY, {
//     reverseProxyUrl: 'https://gpt.pawan.krd/api/chat/completions'
//   });
// } catch (e) {
//   console.error("Unable to auth with Chat GPT");
// }

let waylaidBingChatApi = null;
try {
  waylaidBingChatApi = new BingAIClient({
    userToken: process.env.BING_CHAT_TOKEN
    // // If the above doesn't work, provide all your cookies as a string instead
    // cookies: '',
    // // A proxy string like "http://<ip>:<port>"
    // proxy: '',
  });
} catch (e) {
  console.error("Unable to auth with Bing Chat");
}

let allowOtherUsersToUseChatGPT = true;
let waitingForChatGPTResponse = false;
let lastChatGPTResponse;

let allowOtherUsersToUseBingChat = true;
let waitingForBingChatResponse = false;
let lastBingChatResponse;
let bingChatToneStyle = "balanced";

let userCommandsList = ['\'/\'\n8ball','\tchatgpt','\ncommands','\tded chat','\ndiscord','\tdraw','\nhelp','\tlog','\nshrug','\tstatus','\nsus','\tterminal'];

let adminCommandsList = ['\'/\'\n8ball','\tban','\nchatgpt','\tclear','\nclog','\tcommands','\nded chat','\tdiscord','\ndraw','\tflip','\nhelp','\tkick','\nlock','\tlog','\nmute','\topen','\nshrug','\tsmash','\nstatus','\tstun','\nsus','\tterminal','\nunban','\tunflip','\nunlock','\tunmute','\nunsmash'];

// Set the message command prefix
const prefix = '/';

// Define a new array of objects of special users
const specialUsers = [{Username: 'justsnoopy30', Badge: 'Owner', UsernameColor: '#00b0f4', BadgeColor: '#7289da'}, {Username: 'kmisterk', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#691785'},{Username: 'OliviaTheVampire', Badge: 'Helper', UsernameColor: '#00b0f4', BadgeColor: '#7b3c96'},{Username: 'nbi__', Badge: 'Admin', UsernameColor: '#79f02e', BadgeColor: '#79f02e'}, {Username: '4a656666', Badge: 'Admin', UsernameColor: '#9c59b6', BadgeColor: '#79f02e'}, {Username: 'pixxi', Badge: 'Bonk Head', UsernameColor: '#ff9ff2', BadgeColor: '#ff9ff2'}, {Username: 'nolski', Badge: 'Cool', UsernameColor: '#c22f62', BadgeColor: '#c22f62'}, {Username: 'idkmyusername', Badge: 'Funny User', UsernameColor: '#bd1122', BadgeColor: '#bd1122'}, {Username: 'not good', Badge: 'not good'}, {Username: 'freshtomato', UsernameColor: '#42eff5', Badge: 'Short Stack', BadgeColor: '#42eff5'}, {Username: 'rapids', UsernameColor: '#24a4a2', Badge: 'Platypus', BadgeColor: '#24a4a2'}, {Username: 'titanportal', Badge: 'Titan', BadgeColor: '#a575ff', UsernameColor: '#a575ff'}, {Username: 'wardaaaaaaan', Badge: 'Cheese', BadgeColor: '#e8f00e', UsernameColor: '#e8f00e'}, {Username: 'ectopicsmile', Badge: 'broski', BadgeColor: '#09772f', UsernameColor: '#09772f'}, {Username: 'holy smokes', Badge: 'annoying'}, {Username: 'microsoftexel', Badge: 'fish'}, {Username: 'holysmokes', Badge: 'weirdo'}, {Username: 'neil', Badge: 'pog legend', UsernameColor: '#ff0000', BadgeColor: '#ff7300'}, {Username: 'leoruxu', Badge: 'jellyfish', UsernameColor: '#967bb6', BadgeColor: '#3b67ad'}, {Username: 'conner', Badge: 'kaneki', UsernameColor: '#3489eb', BadgeColor: '#3489eb'}, {Username: 'isa', Badge: 'gymbro', UsernameColor: '#1002b0', BadgeColor: '#1002b0'}, {Username: '__durian', Badge: 'Short German', UsernameColor: '#577794', BadgeColor: '#577794'}, {Username: 'kubic-c', Badge: 'C++ guy', UsernameColor: '#df2c14', BadgeColor: '#df2c14'}, {Username: 'onigirikyoko', Badge: 'Riceball', UsernameColor: '#F8C8DC', BadgeColor: '#F8C8DC'}, {Username: 'dr.protractor', Badge: 'Certified egghead', UsernameColor: '#8f1d20', BadgeColor: '#8f1d20'}, {Username: 'magic8baii', UsernameColor: '#000000'}, {Username: 'soundguy2', UsernameColor: '#64f595', Badge: 'sound dude', BadgeColor: '#64f595'}];

// Set marked options
marked.setOptions({
  gfm: true
});

// Set sanitizeHtmlOptions for sanitize-html
const sanitizeHtmlOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'marquee', 'blink', 'del', 'iframe' ]),
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    img: [
      'src', 'srcset', 'draggable', 'alt', 'class', 'crossorigin'
    ],
    span: ['style', 'class'],
    marquee: ['direction', 'behavior'],
    iframe: ['src', 'height', 'width']
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
  },
  allowedIframeHostnames: ['hyperchat.dev', 'hypercubemc.net']
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

// TODO: Consolidate repeated send and save message code into calls to a single function
// function sendAndSaveMessage({
//   username,
//   message,
//   badge,
//   usernameColor,
//   badgeColor,
//   reactions
// }) {
//   const messageId = generateMessageId();
//   const timestamp = Date.now();

// }

async function handleMessage({io, socket, message}) {
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
  global.userListContents[socket.server].forEach(user => {
    if (!admins.includes(socket.username.toLowerCase())) {
      message = message.replaceAll('@everyone', '<span class="mention-text">@nobody</span>');
    } else {
      message = message.replaceAll('@everyone', '<span class="mention-text">@everyone</span>');
    }
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
  
  const profanityReplacementArray = ['!@#$&?%', '\\*\\*\\*\\*', 'not good', 'Stop', 'No No, Bad Word', 'Sometimes I like to go outside and throw a rake at my neighbors dog'];
  
  // Check the message for bad words
  if(!admins.includes(socket.username.toLowerCase())){
      const filterFoundWords = filterWords(filterOptions);
    if (filterFoundWords.length != 0 && !message.includes('<img')) {
      console.log(`User ${socket.username} tried to swear with: ${filterFoundWords}`);
      
      message = profanityReplacementArray[Math.floor(Math.random() * profanityReplacementArray.length)];
    }
  }

  if (message.startsWith("/shrug")) {
    if (message.length == "/shrug".length) {
      message = "¯\\\\_(ツ)\\_/¯";
    } else {
      message = message.substring("/shrug".length);
      message += " ¯\\\\_(ツ)\\_/¯";
    }
  }
  if (message.startsWith("/log")) {
    io.in(socket.server).emit('log', message.substring("/log".length));
    return;
  }
  if (message.startsWith("/sus")) {
    if(message.length == "/sus".length) {
      message = "<img src=https://i.imgur.com/6GFHDWE.jpg></img>";
    }
  }
  if (message.startsWith("/xbox")) {
    if(message.length == "/xbox".length) {
      message = "<img src=https://www.simpleimageresizer.com/_uploads/photos/f770518c/yo-mama-jokes-xbox-live_60_99.gif></img>";
    }
  }
  if (message.startsWith("/ded chat")) {
    if(message.length == "/ded chat".length) {
      message = "<img src=https://media.tenor.com/U4WZLt3GcI0AAAAM/pacman.gif></img>";
    }else{
      message = message.substring("/ded chat".length);
      message += "<img src=https://media.tenor.com/U4WZLt3GcI0AAAAM/pacman.gif></img>";
    }
  }
  if (message.startsWith('/msg')) {
    const messageWithoutCommand = message.substring("/msg".length + 1);
    const argumentArray = messageWithoutCommand.split(" ");
    const userToMessage = argumentArray[0];
    const messageToSend = messageWithoutCommand.substring(userToMessage.length + 1);
    if (!global.userConnectionsMap.has(userToMessage)) {
      socket.emit("log", `Unable to message ${userToMessage}: User does not exist or is not connected`);
      return;
    }

    global.userConnectionsMap.get(userToMessage).forEach(socketId => {
      io.to(socketId).emit("pm", socket.username, messageToSend); 
    });
    socket.emit("log", `Sent private message "${messageToSend}" to user ${userToMessage}`);
    return;
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
      badgeColor: specialUser.BadgeColor,
      reactions: []
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
      badgeColor: specialUser.BadgeColor,
      reactions: []
    });
    // Add a new message to the database
    messageDocument.save().catch(error => {
      console.error(error);
    });
  }
  else {
    io.in(socket.server).emit('new message', {
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      timestamp: timestamp,
      badge: 'none',
      reactions: []
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: socket.username,
      messageId: messageId,
      message: finalMessage,
      server: socket.server,
      timestamp: timestamp,
      badge: 'none',
      reactions: []
    });
    // Add a new message to the database
    messageDocument.save().catch(error => {
      console.error(error);
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
    messageDocument.save().catch(error => {
      console.error(error);
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
      message: 'Cant do that broski',
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Create the mongoose document for messages using the message model
    const messageDocument = new global.messageModel({
      username: 'HyperChat',
      messageId: messageId,
      message: 'Cant do that broski',
      server: socket.server,
      timestamp: timestamp,
      special: true,
      badge: 'Server'
    });
    // Add a new message to the database
    messageDocument.save().catch(error => {
      console.error(error);
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
    messageDocument.save().catch(error => {
      console.error(error);
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
        messageDocument.save().catch(error => {
          console.error(error);
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
      });
      messageDocument.save().catch(error => {
        console.error(error);
      });
      break;
    }
    case 'mute': {
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      const messageId = generateMessageId();
      // If the user isn't an admin, return with commandAccessDenied()
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
        messageDocument.save().catch(error => {
          console.error(error);
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
        messageDocument.save().catch(error => {
          console.error(error);
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // If the user isn't an admin, return with commandAccessDenied()
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
      // io.in(socket.server).emit('new message', {
      //   username: 'HyperChat',
      //   messageId: messageId,
      //   message: '/draw is disabled for now',
      //   timestamp: timestamp,
      //   special: true,
      //   badge: 'Server'
      // });
      // Create the mongoose document for messages using the message model
      // const messageDocument = new global.messageModel({
      //   username: 'HyperChat',
      //   messageId: messageId,
      //   message: '/draw is disabled for now',
      //   server: socket.server,
      //   timestamp: timestamp,
      //   special: true,
      //   badge: 'Server'
      // });
      // Add a new message to the database
      // messageDocument.save().catch(error => {
      //   console.error(error);
      // });
      // break;
       io.in(socket.server).emit('new message', {
         username: 'HyperChat',
         messageId: messageId,
         message: `<canvas class="whiteboard" id="message-whiteboard-${messageId}"></canvas>`,
         timestamp: timestamp,
         special: true,
         badge: 'Server'
       });
       // Create the mongoose document for messages using the message model
       const messageDocument = new global.messageModel({
         username: 'HyperChat',
         messageId: messageId,
         message: `<canvas class="whiteboard" id="message-whiteboard-${messageId}"></canvas>`,
         server: socket.server,
         timestamp: timestamp,
         special: true,
         badge: 'Server'
      });
      // Add a new message to the database
      messageDocument.save().catch(error => {
         console.error(error);
      });
      break;
    }
    case 'help': {
      const messageId = generateMessageId();
      const helpMessageArray = ['Type to type a message.',  'I don\'t know ask snoopy', 'bro it\'s not that hard to understand', 'no' ];
      var helpMessage = Math.round(Math.random(1, helpMessageArray.length));
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId: messageId,
        message: helpMessageArray[helpMessage],
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });
      // Create the mongoose document for messages using the message model
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId: messageId,
        message: helpMessageArray[helpMessage],
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: 'Server'
     });
     // Add a new message to the database
     messageDocument.save().catch(error => {
      console.error(error);
     });
     break;
    }
    // case 'vanish': {
    //   if (!admins.includes(socket.username.toLowerCase())) {
    //     return commandAccessDenied();
    //   }
    //   var placeOfUser = global.userListContents.indexOf(socket.username);
    //   console.log(placeOfUser);
    //   // if(placeOfUser > -1){
    //   //   .splice(placeOfUser, 1);
    //   // }
    //   break;
    // }
    case 'terminal': {
      const messageId = generateMessageId();
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId: messageId,
        message: '<iframe src="https://hypercubemc.net/terminal-demo/" width="910px" height="200px">',
        timestamp: timestamp,
        special: true,
        badge: 'Server'
      });
      // Create the mongoose document for messages using the message model
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId: messageId,
        message: '<iframe src="https://hypercubemc.net/terminal-demo/" width="910px" height="200px">',
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: 'Server'
     });
     // Add a new message to the database
     messageDocument.save().catch(error => {
       console.error(error);
     });
     break;
    }
    case 'lock': {
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      global.isLoginLocked = true;
      break;
    }
    case 'unlock': {
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      global.isLoginLocked = false;
      break;
    }
    case '8ball': {
      const messageId = generateMessageId();
      let ballMessageArray = ['Possibly So.', 'Without a doubt', 'Try Again Later.', 'Definitely.', 'My Sources Answer No.', 'Probably Not.', 'I\'m Not Sure.', 'It Is Decidedly So', 'Don\'t Count On It.', 'Very Doubtful.', 'No.', 'Yes.', 'Better Not Tell You Now.', 'Can\'t Say', 'Absolutely Not.', 'Never In A Million Years.', 'Having Trouble Connecting, Please Try Again Later.', 'Outlook Is Looking Good.', 'I Can\'t Be Certain'];
      let random8BallMessage = Math.round(Math.random()*10);
      let ballMessage = ballMessageArray[random8BallMessage];
      io.in(socket.server).emit('new message', {
        username: 'Magic8BaII',
        messageId,
        message: ballMessage,
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: '8 Ball',
        badgeColor: '#000000'
      });
      // Create the mongoose document for messages using the message model
      const messageDocument = new global.messageModel({
        username: 'Magic8BaII',
        messageId,
        message: ballMessage,
        server: socket.server,
        timestamp: timestamp,
        special: true,
        badge: '8 Ball',
        badgeColor: '#000000'
      });
      // Add a new message to the database
      messageDocument.save().catch(error => {
        console.error(error);
      });
      break;
    }
    case 'chatgpt': {
      // if (!specialUser) {
      //   io.in(socket.server).emit('new message', {
      //     username: 'ChatGPT',
      //     messageId: messageId,
      //     message: "Sorry, but you must have a badge to use the integrated ChatGPT feature.",
      //     server: socket.server,
      //     timestamp: timestamp,
      //     special: true,
      //     badge: 'Bot',
      //     usernameColor: '#19c37d'
      //   });
      //   // Create the mongoose document for messages using the message model
      //   const messageDocument = new global.messageModel({
      //     username: 'ChatGPT',
      //     messageId: messageId,
      //     message: "Sorry, but you must have a badge to use the integrated ChatGPT feature.",
      //     server: socket.server,
      //     timestamp: timestamp,
      //     special: true,
      //     badge: 'Bot',
      //     usernameColor: '#19c37d'
      //   });
      //   // Add a new message to the database
      //   messageDocument.save().catch(error => {
      //     console.error(error);
      //   });
      //   return;
      // }
      if (socket.username.toLowerCase() != "justsnoopy30" && !allowOtherUsersToUseChatGPT) {
        return;
      }
      const messageId = generateMessageId();
      if (chatGPTApi == null) {
      // if (waylaidChatGPTApi == null) {
        io.in(socket.server).emit('new message', {
          username: 'ChatGPT',
          messageId: messageId,
          message: "Not authenticated",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'ChatGPT',
          messageId: messageId,
          message: "Not authenticated",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
        return;
      }
      if (waitingForChatGPTResponse) {
        io.in(socket.server).emit('new message', {
          username: 'ChatGPT',
          messageId: messageId,
          message: "Please wait for me to respond before asking again...",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'ChatGPT',
          messageId: messageId,
          message: "Please wait for me to respond before asking again...",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
        return;
      }
      waitingForChatGPTResponse = true;
      try {
        let startedTyping = false;
        let prePrompt = `My username is "${socket.username}". I am in a chatroom similar to Discord, called HyperChat.`
        if (specialUser?.Badge) {
          prePrompt += ` My tag is "${specialUser.Badge}".`;
        }
        const currentTime = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        prePrompt += ` Metadata: This message was sent at ${currentTime}, CST.`
        // TODO: Potentially add personalized prompts about each user
        // TODO: Fix issue where someone joining the chatroom during the response won't see the incremental or final message

        const response = await chatGPTApi.sendMessage(`${prePrompt} ${commandArgument}`, {
          conversationId: lastChatGPTResponse?.conversationId,
          parentMessageId: lastChatGPTResponse?.id,
          timeoutMs: 2 * 60 * 1000,
          name: socket.username.replaceAll(".", "_"), // tempfix for dr. protractor
          onProgress: (partialResponse) => {
            const partialResponseHtml = 
            `In reply to <span class="mention-text">@${socket.username}</span><br> ${marked(partialResponse.text)}`.trim().replace(/^\s+|\s+$/g, '');
            const sanitizedPartialResponseHtml = sanitizeHtml(partialResponseHtml, sanitizeHtmlOptions);

            if (!startedTyping) {
              io.in(socket.server).emit('typing', "ChatGPT");
              io.in(socket.server).emit('new message', {
                username: 'ChatGPT',
                messageId: messageId,
                message: sanitizedPartialResponseHtml,
                server: socket.server,
                timestamp: timestamp,
                special: true,
                badge: 'Bot',
                usernameColor: '#19c37d'
              });
              startedTyping = true;
            } else {
              io.in(socket.server).emit('edit message', messageId, sanitizedPartialResponseHtml);
            }
          }
        });
        // let partialResponse = '';
        // const response = await waylaidChatGPTApi.sendMessage(`${prePrompt} ${commandArgument}`, {
        //   conversationId: lastChatGPTResponse?.conversationId,
        //   parentMessageId: lastChatGPTResponse?.id,
        //   timeoutMs: 2 * 60 * 1000,
        //   name: socket.username,
        //   onProgress: (token) => {
        //     partialResponse += token;
            
        //     const partialResponseHtml = 
        //     `In reply to <span class="mention-text">@${socket.username}</span><br> ${marked(partialResponse)}`.trim().replace(/^\s+|\s+$/g, '');
        //     const sanitizedPartialResponseHtml = sanitizeHtml(partialResponseHtml, sanitizeHtmlOptions);

        //     if (!startedTyping) {
        //       io.in(socket.server).emit('typing', "ChatGPT");
        //       io.in(socket.server).emit('new message', {
        //         username: 'ChatGPT',
        //         messageId: messageId,
        //         message: sanitizedPartialResponseHtml,
        //         server: socket.server,
        //         timestamp: timestamp,
        //         special: true,
        //         badge: 'Bot',
        //         usernameColor: '#19c37d'
        //       });
        //       startedTyping = true;
        //     } else {
        //       io.in(socket.server).emit('edit message', messageId, sanitizedPartialResponseHtml);
        //     }
        //   }
        // });
        lastChatGPTResponse = response;
        // Convert markdown to html with the Marked markdown library, trim trailing whitespace and newlines
        const responseHtml = 
          `In reply to <span class="mention-text">@${socket.username}</span><br> ${marked(response.text)}`.trim().replace(/^\s+|\s+$/g, '');

        // Sanitize the message html with the sanitize-html library
        const finalResponse = sanitizeHtml(responseHtml, sanitizeHtmlOptions);
        io.in(socket.server).emit('edit message', messageId, finalResponse);
        // io.in(socket.server).emit('new message', {
        //   username: 'ChatGPT',
        //   messageId: messageId,
        //   message: finalResponse,
        //   server: socket.server,
        //   timestamp: timestamp,
        //   special: true,
        //   badge: 'Bot',
        //   usernameColor: '#19c37d'
        // });

        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'ChatGPT',
          messageId: messageId,
          message: finalResponse,
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      } catch (error) {
        console.log(error);
        io.in(socket.server).emit('new message', {
          username: 'ChatGPT',
          messageId: messageId,
          message: sanitizeHtml(`<p>${error}</p>`, sanitizeHtmlOptions),
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'ChatGPT',
          messageId: messageId,
          message: sanitizeHtml(`<p>${error}</p>`, sanitizeHtmlOptions),
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      }
      io.in(socket.server).emit('stop typing', "ChatGPT");
      waitingForChatGPTResponse = false;
      break;
    }
    case 'bingchat': {
      // if (!specialUser) {
      //   io.in(socket.server).emit('new message', {
      //     username: 'ChatGPT',
      //     messageId: messageId,
      //     message: "Sorry, but you must have a badge to use the integrated ChatGPT feature.",
      //     server: socket.server,
      //     timestamp: timestamp,
      //     special: true,
      //     badge: 'Bot',
      //     usernameColor: '#19c37d'
      //   });
      //   // Create the mongoose document for messages using the message model
      //   const messageDocument = new global.messageModel({
      //     username: 'ChatGPT',
      //     messageId: messageId,
      //     message: "Sorry, but you must have a badge to use the integrated ChatGPT feature.",
      //     server: socket.server,
      //     timestamp: timestamp,
      //     special: true,
      //     badge: 'Bot',
      //     usernameColor: '#19c37d'
      //   });
      //   // Add a new message to the database
      //   messageDocument.save().catch(error => {
      //     console.error(error);
      //   });
      //   return;
      // }
      if (socket.username.toLowerCase() != "justsnoopy30" && !allowOtherUsersToUseBingChat) {
        return;
      }
      const messageId = generateMessageId();
      if (waylaidBingChatApi == null) {
        io.in(socket.server).emit('new message', {
          username: 'Bing AI',
          messageId: messageId,
          message: "Not authenticated",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'Bing AI',
          messageId: messageId,
          message: "Not authenticated",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
        return;
      }
      if (waitingForBingChatResponse) {
        io.in(socket.server).emit('new message', {
          username: 'Bing AI',
          messageId: messageId,
          message: "Please wait for me to respond before asking again...",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'Bing AI',
          messageId: messageId,
          message: "Please wait for me to respond before asking again...",
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
        return;
      }
      waitingForBingChatResponse = true;
      try {
        let startedTyping = false;
        // let prePrompt = `My username is "${socket.username}". I am in a chatroom similar to Discord, called HyperChat.`
        // if (specialUser?.Badge) {
        //   prePrompt += ` My tag is "${specialUser.Badge}".`;
        // }
        const currentTime = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        // prePrompt += ` Metadata: This message was sent at ${currentTime}, CST.`
        let prePrompt = "";
        // TODO: Potentially add personalized prompts about each user
        // TODO: Fix issue where someone joining the chatroom during the response won't see the incremental or final message

        let partialResponse = '';
        const response = await waylaidBingChatApi.sendMessage(`${prePrompt} ${commandArgument}`, {
          // conversationSignature: lastBingChatResponse?.conversationSignature,
          // conversationId: lastBingChatResponse?.conversationId,
          // clientId: lastBingChatResponse?.clientId,
          // invokationId: lastBingChatResponse?.invokationId,
          toneStyle: bingChatToneStyle,
          jailbreakConversationId: lastBingChatResponse?.jailbreakConversationId != null ? lastBingChatResponse.jailbreakConversationId : true,
          parentMessageId: lastBingChatResponse?.messageId,
          onProgress: (token) => {
            partialResponse += token;
            
            const partialResponseHtml = 
            `In reply to <span class="mention-text">@${socket.username}</span><br> ${marked(partialResponse)}`.trim().replace(/^\s+|\s+$/g, '');
            const sanitizedPartialResponseHtml = sanitizeHtml(partialResponseHtml, sanitizeHtmlOptions);

            if (!startedTyping) {
              io.in(socket.server).emit('typing', "Bing AI");
              io.in(socket.server).emit('new message', {
                username: 'Bing AI',
                messageId: messageId,
                message: sanitizedPartialResponseHtml,
                server: socket.server,
                timestamp: timestamp,
                special: true,
                badge: 'Bot',
                usernameColor: '#19c37d'
              });
              startedTyping = true;
            } else {
              io.in(socket.server).emit('edit message', messageId, sanitizedPartialResponseHtml);
            }
          }
        });
        console.log(response.details);
        lastBingChatResponse = response;
        // Convert markdown to html with the Marked markdown library, trim trailing whitespace and newlines
        const responseHtml = 
          `In reply to <span class="mention-text">@${socket.username}</span><br> ${marked(response.response)}`.trim().replace(/^\s+|\s+$/g, '');

        // Sanitize the message html with the sanitize-html library
        const finalResponse = sanitizeHtml(responseHtml, sanitizeHtmlOptions); // TODO: Include details.sourceAttributions
        if (partialResponse) {
          io.in(socket.server).emit('edit message', messageId, finalResponse);
        } else {
          io.in(socket.server).emit('new message', {
            username: 'Bing AI',
            messageId: messageId,
            message: finalResponse,
            server: socket.server,
            timestamp: timestamp,
            special: true,
            badge: 'Bot',
            usernameColor: '#19c37d'
          });
        }
        // io.in(socket.server).emit('new message', {
        //   username: 'ChatGPT',
        //   messageId: messageId,
        //   message: finalResponse,
        //   server: socket.server,
        //   timestamp: timestamp,
        //   special: true,
        //   badge: 'Bot',
        //   usernameColor: '#19c37d'
        // });

        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'Bing AI',
          messageId: messageId,
          message: finalResponse,
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      } catch (error) {
        console.log(error);
        io.in(socket.server).emit('new message', {
          username: 'Bing AI',
          messageId: messageId,
          message: sanitizeHtml(`<p>${error}</p>`, sanitizeHtmlOptions),
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot',
          usernameColor: '#19c37d'
        });
        // Create the mongoose document for messages using the message model
        const messageDocument = new global.messageModel({
          username: 'Bing AI',
          messageId: messageId,
          message: sanitizeHtml(`<p>${error}</p>`, sanitizeHtmlOptions),
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Bot'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      }
      io.in(socket.server).emit('stop typing', "Bing AI");
      waitingForBingChatResponse = false;
      break;
    }
    case 'bingChatStyle': {
      if (commandArgument) {
        if (commandArgument == "balanced" || commandArgument == "creative" || commandArgument == "precise") {
          bingChatToneStyle = commandArgument;
        } else {
          io.in(socket.server).emit('new message', {
            username: 'HyperChat',
            messageId: messageId,
            message: 'Style must be "creative", "balanced", or "precise"',
            server: socket.server,
            timestamp,
            special: true,
            badge: 'Server'
          });
          const messageDocument = new global.messageModel({
            username: 'HyperChat',
            messageId: messageId,
            message: 'Style must be "creative", "balanced", or "precise"',
            server: socket.server,
            timestamp: timestamp,
            special: true,
            badge: 'Server'
          });
          // Add a new message to the database
          messageDocument.save().catch(error => {
            console.error(error);
          });
        }
      } else {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: `Current style: ${bingChatToneStyle}`,
          server: socket.server,
          timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: `Current style: ${bingChatToneStyle}`,
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      }
      break;
    }
    case 'commands': {
      const messageId = generateMessageId();
      if (!admins.includes(socket.username.toLowerCase())) {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: `The current commands available to ${socket.username} are ${userCommandsList}`,
          server: socket.server,
          timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: `The current commands available to ${socket.username} are ${userCommandsList}`,
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      } else if (admins.includes(socket.username.toLowerCase())) {
        io.in(socket.server).emit('new message', {
          username: 'HyperChat',
          messageId: messageId,
          message: `The current commands available to ${socket.username} are ${adminCommandsList}`,
          server: socket.server,
          timestamp,
          special: true,
          badge: 'Server'
        });
        const messageDocument = new global.messageModel({
          username: 'HyperChat',
          messageId: messageId,
          message: `The current commands available to ${socket.username} are ${adminCommandsList}`,
          server: socket.server,
          timestamp: timestamp,
          special: true,
          badge: 'Server'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
      }
      
      break;
    }
    case 'discord': {
      const messageId = generateMessageId();
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId: messageId,
        message: '<a href=https://discord.gg/jcKQmek4br>Join the HyperCubeMC Discord!</a>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
      });
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId: messageId,
        message: '<a href=https://discord.gg/jcKQmek4br>Join the HyperCubeMC Discord!</a>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
      });
      // Add a new message to the database
      messageDocument.save().catch(error => {
        console.error(error);
      });
      break;
    }
    case 'toggleOthersAccessToChatGPT': {
      if (socket.username == "Justsnoopy30") {
        allowOtherUsersToUseChatGPT = !allowOtherUsersToUseChatGPT;
      }
      break;
    }
    case 'browser': {
      const messageId = generateMessageId();
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId,
        message: '<iframe src="https://google.com/" width="910px" length="200px"></iframe>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
      });
      const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId,
        message: 'iframe src="https://google.com/" width="910px" length="200px"></iframe>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
      });
      // Add a new message to the database
      messageDocument.save().catch(error => {
        console.error(error);
      });
      break;
    }
    case 'timeout': {
      if (!admins.includes(socket.username.toLowerCase())) {
        return commandAccessDenied();
      }
      const commandArg = commandArgument.split(' ');
      if (!global.userListContents[socket.server].some(user => user.username === commandArg[0])) {
        return commandNonexistingUserSpecified();
      }
      var timeoutDuration = commandArg[1];
      var userToTimeout = commandArg[0];
      if (typeof timeoutDuration === 'string' && timeoutDuration === 'cancel'){
        timeoutUser();
        return;
      }
      global.mutedList.push(userToTimeout);
      global.userConnectionsMap.get(userToTimeout).forEach(socketID => {
        io.to(socketID).emit('mute', 'You have been timed out for ' + timeoutDuration + " seconds.");
      });
      const timeoutUser = () => {
          global.mutedList.splice(global.mutedList.indexOf(userToTimeout));
          global.mutedList = arrayRemove(global.mutedList, userToTimeout);
          global.userConnectionsMap.get(userToTimeout).forEach(socketID => {
          io.to(socketID).emit('unmute');
          });
          console.log('Timeout duration: ' + timeoutDuration + '\tUser to timeout: ' + userToTimeout);
      }
      if (typeof timeoutDuration === 'number' && timeoutDuration > 0){
          setTimeout(timeoutUser(userToTimeout), timeoutDuration*1000);
      }
      // else{
      //   io.in(socket.server).emit('new message', {
      //     username: 'HyperChat',
      //     messageId,
      //     message: 'Please enter the duration of the timeout in milliseconds',
      //     server: socket.server,
      //     timestamp,
      //     special: true,
      //     badge: 'Server'
      //   });
      //   const messageDocument = new global.messageModel({
      //     username: 'HyperChat',
      //     messageId,
      //     message: 'Please enter the duration of the timeout in milliseconds',
      //     server: socket.server,
      //     timestamp,
      //     special: true,
      //     badge: 'Server'
      //   });
      // }
      break;
    }
    default: {
      // if (konamiActivated) {
      //   io.in(socket.server).emit('new message', {
      //     username: 'HyperChat',
      //     messageId,
      //     message: 'Please disable konami code to use commands',
      //     server: socket.server,
      //     timestamp,
      //     special: true,
      //     badge: 'Server'
      //   });
      //   const messageDocument = new global.messageModel({
      //     username: 'HyperChat',
      //     messageId,
      //     message: 'Please disable konami code to use commands',
      //     server: socket.server,
      //     timestamp,
      //     special: true,
      //     badge: 'Server'
      //   });
      //   // Add a new message to the database
      //   messageDocument.save().catch(error => {
      //     console.error(error);
      //   });
      //   return;
      // } else {
        invalidCommand();
      // }
      break;
    }
    case 'gam': {
      io.in(socket.server).emit('new message', {
        username: 'HyperChat',
        messageId,
        message: '<iframe src="https://scratch.mit.edu/projects/371668558/embed" allowtransparency="true" width="800" height="250" frameborder="0" scrolling="no" allowfullscreen></iframe>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
        });
        const messageDocument = new global.messageModel({
        username: 'HyperChat',
        messageId,
        message: '<iframe src="https://scratch.mit.edu/projects/800189469/embed" allowtransparency="true" width="800" height="250" frameborder="0" scrolling="no" allowfullscreen></iframe>',
        server: socket.server,
        timestamp,
        special: true,
        badge: 'Server'
        });
        // Add a new message to the database
        messageDocument.save().catch(error => {
          console.error(error);
        });
        return;
    }
  }
}

// Export the handleMessage function as the default export
export default handleMessage;
