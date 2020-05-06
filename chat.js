// Import MagicHelper!
import $ from './MagicHelper/MagicHelper.js';

let notificationPermission = 'default';
if ('serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller) {
    console.log('Service worker is controlling the site.');
    console.log('Sent \'Initial message to service worker.\' to service worker.')
    navigator.serviceWorker.controller.postMessage('Initial message to service worker.');
  }
  else {
    // Register the ServiceWorker
    navigator.serviceWorker.register('service-worker.js', {
      scope: './'
    });
    console.log('Service worker registered on the site.')
  }

  // Set the notification permission variable to the browser's notification permission state if the browser supports notifications.
  if ('Notification' in window) {
    notificationPermission = Notification.permission;
  }
}

// eslint-disable-next-line no-unused-vars
function notificationPermissionPrompt() {
  if ('Notification' in window) {
    Notification.requestPermission(function(result) {
      if (result === 'granted') {
        notificationPermission = 'granted';
      }
    });
  }
} // Used to show a permission prompt to grant access to notifications

let fadeTime = 150; // In ms
let typingTimerLength = 1000; // In ms
let colors = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
]; // Colors for usernames

// Initialize variables
let currentInput; // Current input focus variable
let username;
let password;
let room;
let connected = false;
let typing = false;
let lastTypingTime;
let userListContents;
let loggedIn;
let cheatActivated;
let notificationReplyMessage;
let initialLogin = true;
let darkThemeSwitchState;
let pageVisible;
let systemTheme;
let usersTypingArray = [];
let socket; // Socket.io, placeholder letiable until assigned later below.
const converter = new showdown.Converter({tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, backslashEscapesHTMLTags: true, ghMentions: true});

// Initialize sounds for the chat app.
const chatMessageSound = new Audio('./assets/ChatMessageSound.webm');
const userLeftChatSound = new Audio('./assets/UserLeftChat.webm');
const userJoinedChatSound = new Audio('./assets/UserJoinedChat.webm');
const lostConnectionSound = new Audio('./assets/LostConnection.webm');
const regainedConnectionSound = new Audio('./assets/RegainedConnection.webm');
const stunSound = new Audio('./assets/Stun.webm');
const kickSound = new Audio('./assets/Kick.webm');

let sequences = {
  primary: 'up up down down left right left right b a',
};

cheet(sequences.primary);

cheet.done(function (seq) {
  if (seq === sequences.primary) {
    cheatActivated = true
  }
});

function isElectron() {
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }
  else {
    return false;
  }
}

if (isElectron()) {
  socket = io('https://hyperchat.cf');
}
else {
  socket = io();
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  systemTheme = 'dark';
}
else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  systemTheme = 'light';
}
else {
  systemTheme = 'light';
}

// Here is the function to change the theme.
const changeTheme = (theme) => {
  store('theme', theme);
  let inverse;
  let iconPrefix;
  if (theme == 'light') {
    inverse = 'dark';
    iconPrefix = 'Black';
  }
  if (theme == 'dark') {
    inverse = 'light';
    iconPrefix = 'White';
  }
  $('body').addClass(theme);
  $('body').removeClass(inverse);
  $('#settingsIconInChat').src = `./assets/${iconPrefix}SettingsIcon.png`;
  $('#settingsIconInSettings').src = `./assets/${iconPrefix}SettingsIcon.png`;
  $('#notificationBell').src = `./assets/${iconPrefix}NotificationBell.png`;
  $('#settingsTopBar').removeClass(`navbar-${inverse}`, `bg-${inverse}`);
  $('#settingsTopBar').addClass(`navbar-${theme}`, `bg-${theme}`);
  $('#inputMessage').removeClass(`${inverse}ThemeScrollbar`);
  $('#inputMessage').addClass(`${theme}ThemeScrollbar`);
  $('#messages').removeClass(`${inverse}ThemeScrollbar`);
  $('#messages').addClass(`${theme}ThemeScrollbar`);
}

if (store('theme') == null) {
  changeTheme(systemTheme); // If the theme is not stored, set the theme to the user's system theme.
}

if (store('theme') == 'light') {
  $('#lightThemeRadio').checked = true; // Set the light theme radio to checked if the theme is light on page load
  changeTheme('light');
}

if (store('theme') == 'dark') {
  $('#darkThemeRadio').checked = true; // Set the dark theme radio to checked if the theme is dark on page load
  changeTheme('dark');
}

$('#lightThemeRadio').on('change', function (event) {
  changeTheme('light'); // Light theme radio chosen, so change the theme to light.
});

$('#darkThemeRadio').on('change', function (event) {
  changeTheme('dark'); // Dark theme radio chosen, so change the theme to dark.
});

function onVisibilityChange(callback) {
  let visible = true;

  if (!callback) {
    throw new Error('no callback given');
  }

  function focused() {
    if (!visible) {
        callback(visible = true);
    }
  }

  function unfocused() {
    if (visible) {
        callback(visible = false);
    }
  }

  // Standards:
  if ('hidden' in document) {
    document.addEventListener('visibilitychange',
      function() {(document.hidden ? unfocused : focused)()});
  }
  if ('mozHidden' in document) {
    document.addEventListener('mozvisibilitychange',
      function() {(document.mozHidden ? unfocused : focused)()});
  }
  if ('webkitHidden' in document) {
    document.addEventListener('webkitvisibilitychange',
      function() {(document.webkitHidden ? unfocused : focused)()});
  }
  if ('msHidden' in document) {
    document.addEventListener('msvisibilitychange',
      function() {(document.msHidden ? unfocused : focused)()});
  }
  // IE 9 and lower:
  if ('onfocusin' in document) {
    document.onfocusin = focused;
    document.onfocusout = unfocused;
  }
  // All others:
  window.onpageshow = window.onfocus = focused;
  window.onpagehide = window.onblur = unfocused;
}

onVisibilityChange(function(visible) {
  pageVisible = visible;
});

function showsettingsScreen() {
  $('#chatScreen').fadeOut();
  $('#settingsScreen').fadeIn()
}

function hidesettingsScreen() {
  $('#settingsScreen').fadeOut();
  $('#chatScreen').fadeIn();
  $('#settingsScreen').removeEventListener('click', showsettingsScreen);
}

function showreconnectingScreen() {
  if (loggedIn) {
    $('#chatScreen').fadeOut();
    $('#reconnectingScreen').fadeIn();
  }
  else {
    $('#loginScreen').fadeOut();
    $('#reconnectingScreen').fadeIn();
  }
}

function hidereconnectingScreen() {
  if (loggedIn) {
    $('#reconnectingScreen').fadeOut();
    $('#chatScreen').fadeIn();
  }
  else {
    $('#reconnectingScreen').fadeOut();
    $('#loginScreen').fadeIn();
  }
}

function arrayRemove(array, value) {
  return array.filter(function(ele) {
    return ele != value;
  });
}

// Submits the credentials to the server
const submitLoginInfo = () => {
  username = cleanInput($('#usernameInput').value.trim());
  password = cleanInput($('#passwordInput').value.trim());
  room = cleanInput($('#roomInput').value.trim());
  // Tell the server your username, password, and room
  socket.emit('login', { username, password, room });
}

socket.on('login authorized', () => {
  if (initialLogin) {
    $('#loginScreen').fadeOut();
    $('#chatScreen').fadeIn();
    currentInput = $('#inputMessage').focus();
    connected = true;
    loggedIn = true
    // Display the welcome message
    log('Welcome to ' + room + '!', {
      prepend: true
    });
  }
});

socket.on('login denied', (data) => {
  let loginDeniedReason = data.loginDeniedReason;
  alert(loginDeniedReason);
  location.reload();
});

socket.on('user list', (data) => {
  userListContents = data.userListContents;
  syncUserList(userListContents);
});

socket.on('mute', () => {
  $('#inputMessage').disabled = true;
  alert('You are now muted!');
});

socket.on('unmute', () => {
  $('#inputMessage').disabled = false;
  alert('You are now unmuted!');
});

socket.on('flip', () => {
  ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix) {
    document.body.style[prefix + 'transform'] = 'rotate(180deg)';
  });
});

socket.on('unflip', () => {
  ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix) {
    document.body.style[prefix + 'transform'] = 'rotate(0deg)';
  });
});

socket.on('stupidify', () => {
  (function(){
    let TEXT = 'When I looked in the mirror, the reflection showed Joe Mama. Then the mirror screamed, and shattered. '
    Array.prototype.slice.call(document.querySelectorAll('input,textarea')).map(function(el){
      el.onkeypress=function(evt){
        let charCode = typeof evt.which == 'number' ? evt.which : evt.keyCode;
        if (charCode && charCode > 31) {
          let start = this.selectionStart, end = this.selectionEnd;
          this.value = this.value.slice(0, start) + TEXT[start % TEXT.length] + this.value.slice(end);
          this.selectionStart = this.selectionEnd = start + 1;
        }
        return false;
      }
    });
  }());
});

socket.on('smash', () => {
  ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix){
    Array.prototype.slice.call(document.querySelectorAll('div,p,span,img,a,body')).map(function(el){
      el.style[prefix + 'transform'] = 'rotate(' + (Math.floor(Math.random() * 10) - 1) + 'deg)';
    });
  });
});

socket.on('kick', () => {
  kickSound.play();
  alert('You have been kicked from the chatroom.');
  location.reload();
});

socket.on('stun', () => {
  stunSound.play();
});

if ('serviceWorker' in navigator && 'Notification' in window ) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    console.log('Got message from service worker: ' + event.data);
    if (event.data.startsWith('Notification Quick Reply:')) {
      notificationReplyMessage = event.data;
      notificationReplyMessage = notificationReplyMessage.replace(/^(Notification Quick Reply\: )/,'');
      sendMessage(notificationReplyMessage);
    }
  });
}

// Sends a chat message
const sendMessage = (message) => {
  if (message && connected && !cheatActivated) {
    $('#inputMessage').value = '';
    socket.emit('new message', message);
  }
  else if (message && connected && cheatActivated) {
    socket.emit('new message', message);
  }
}

// Sync the content of the user list.
const syncUserList = (userListContents) => {
  for (let user = 0; user < userListContents.length; user++) {
    if (userListContents[user] !== undefined) {
      let userToAddToUserList = document.createElement('li');
      userToAddToUserList.addClass('userInUserlist');
      userToAddToUserList.text(userListContents[user])
      $('#userListContents').appendChild(userToAddToUserList);
    }
  }
}

// Log a message
const log = (message, options) => {
  let messageElement = document.createElement('li');
  messageElement.addClass('log')
  messageElement.text(message);
  addMessageElement(messageElement, options);
}

// Add a user to the user list.
const addToUserList = (user) => {
  let userToAddToUserlist = document.createElement('li');
  userToAddToUserlist.addClass('userInUserList')
  userToAddToUserlist.text(user);
  $('#userListContents').appendChild(userToAddToUserlist);
}

// Remove a user from the user list.
const removeFromUserList = (user) => {
  for (let userInUserList of document.querySelectorAll('#userList .userInUserList')) {
    if (userInUserList.text() === user) {
      userInUserList.remove();
      break;
    }
  }
}

// Adds the visual chat message to the message list
const addChatMessage = (data, options) => {
  options = options || {};
  let usernameDiv = document.createElement('span');
  usernameDiv.addClass('username')
  usernameDiv.innerText = data.username;
  usernameDiv.style.color = getUsernameColor(data.username);

  let messageBodyDiv = document.createElement('span');
  messageBodyDiv.addClass('messageBody');
  messageBodyDiv.innerHTML = data.message;

  let messageDiv = document.createElement('li');
  messageDiv.addClass('message');
  messageDiv.setAttribute('data-username', data.username);
  messageDiv.append(usernameDiv, messageBodyDiv);

  addMessageElement(messageDiv, options);
}

// Sync the user typing message
const syncUsersTyping = (usersTypingArray) => {
  const usersTypingMax = 3;
  const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }); // This is for formatting the users out in a string list seperated by commas

  function formatUsersTyping (usersTypingArray) {
    if (!usersTypingArray || !usersTypingArray.length) {
      return '';
    }

    const usersTyping = [...usersTypingArray];
    if (usersTyping.length > usersTypingMax) {
      usersTyping.splice(
        usersTypingMax - 1,
        usersTyping.length,
        `${usersTypingArray.length - (usersTypingMax - 1)} others`,
      ); // Make a new array usersTyping with 'x others' in replacement of users after the 3rd user
    }
    const usersString = listFormatter.format(usersTyping); // Call the function format and formats the users typing string
    const verb = usersTyping.length > 1 ? 'are' : 'is'; // If more than one person are typing, use 'are' instead of 'is'

    return [usersString, verb, 'typing...'].join(' ');
  }

  let usersTypingText = formatUsersTyping(usersTypingArray);

  if (usersTypingText !== '') {
    let element = document.createElement('span');
    element.addClass('typing');
    element.text(usersTypingText);
    $('#typingMessageArea').html(element.outerHTML);
  }
  else {
    $('#typingMessageArea').html('');
  }
}

// Adds a message element to the messages and scrolls to the bottom
// element - The element to add as a message
// options.prepend - If the element should prepend
//   all other messages (default = false)
const addMessageElement = (element, options) => {
  // Setup default options
  if (!options) {
    options = {};
  }

  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }

  if (options.prepend) {
    $('#messages').prepend(element);
  }
  else {
    $('#messages').append(element);
  }

  // $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
}

// Prevents input from having injected markup
const cleanInput = (input) => {
  let tmp = document.createElement('div');
  tmp.innerHTML = input;
  return tmp.textContent || tmp.innerText || '';
}

// Updates the typing event
const updateTyping = () => {
  if (connected) {
    if (!typing) {
      typing = true;
      socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();

    setTimeout(() => {
      let typingTimer = (new Date()).getTime();
      let timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= typingTimerLength && typing) {
        socket.emit('stop typing');
        typing = false;
      }
    }, typingTimerLength);
  }
}

// Gets the color of a username through our hash function
const getUsernameColor = (username) => {
  // Compute hash code
  let hash = 7;
  for (let i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  // Calculate color
  let index = Math.abs(hash % colors.length);
  return colors[index];
}

// Keyboard events

$('#inputMessage').on('input', function (event) {
  this.css('height', 'auto');
  this.css('height', this.scrollHeight + 'px');
});

$('#inputMessage').on('keydown', function (event) {
  if (event.key=='Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage($('#inputMessage').value);
    socket.emit('stop typing');
    typing = false;
    this.css('height', 'auto');
  }
});


document.addEventListener('keydown', (event) => {
  if (loggedIn) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) && currentInput) {
      currentInput.focus();
    }
  }
  // When the client hits ENTER on their keyboard
  if (event.key == 'Enter' && !event.shiftKey && !username) {
    submitLoginInfo();
  }
});

$('#inputMessage').on('input', updateTyping);

// Set focus to username input when clicked
$('#usernameInput').on('click', () => {
  currentInput = $('#usernameInput').focus();
});

// Set focus to password input when clicked
$('#passwordInput').on('click',() => {
  currentInput = $('#passwordInput').focus();
});

// Focus input when clicking on the message input's border
$('#inputMessage').on('click', () => {$('#inputMessage').focus()});

// Go to the settings page when the settings icon on the chat page is clicked
$('#settingsIconInChat').on('click', showsettingsScreen);

// Go to the chat page when the settings icon in settings is clicked
$('#settingsIconInSettings').on('click', hidesettingsScreen);

// Show the notification permission prompt when the notification bell is clicked
$('#notificationBell').on('click', notificationPermissionPrompt);

// Socket events

// Whenever the server emits 'new message', update the chat body
socket.on('new message', (data) => {
  if (data.username !== username) {
    addChatMessage(data);
    chatMessageSound.play();
    if ('navigator.serviceWorker.controller' && notificationPermission === 'granted' && data.message.includes('@' + username)) { // Make sure we have the permission to send notifications and the user was mentioned
      let notificationMessage = converter.makeMarkdown(data.message); // Convert html to markdown for the notification
      navigator.serviceWorker.ready.then(function(registration) {
        registration.showNotification(data.username, {
          body: notificationMessage,
          icon: './assets/favicon.ico',
          vibrate: [200, 100, 200, 100, 200, 100, 200],
          tag: 'pingNotification',
          actions: [
            {action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type your reply.'},
            {action: 'close', title: 'Close notification'}
          ]
        });
      });
    }
  }
  else {
    addChatMessage(data);
  }
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', (data) => {
  log(data.username + ' joined the chatroom.');
  userJoinedChatSound.play();
  addToUserList(data.username);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', (data) => {
  log(data.username + ' left the chatroom.');
  userLeftChatSound.play();
  removeFromUserList(data.username);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', (data) => {
  usersTypingArray.push(data.username);
  syncUsersTyping(usersTypingArray);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', (data) => {
  usersTypingArray = arrayRemove(usersTypingArray, data.username);
  syncUsersTyping(usersTypingArray);
});

socket.on('disconnect', () => {
  log('You have been disconnected.');
  lostConnectionSound.play();
  showreconnectingScreen();
});

socket.on('reconnect', () => {
  hidereconnectingScreen();
  regainedConnectionSound.play();
  log('You have been reconnected.');
  if (username) {
    initialLogin = false;
    const userListContents = document.getElementById('userListContents');
    while (userListContents.firstChild) {
      userListContents.removeChild(userListContents.firstChild);
    }
    socket.emit('login', { username, password, room });
  }
});

socket.on('reconnect_error', () => {
  log('Attempt to reconnect has failed');
});
