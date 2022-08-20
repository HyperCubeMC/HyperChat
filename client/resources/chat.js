// Import dependencies
// import 'https://polyfill.io/v3/polyfill.min.js';
import { grab, grabAll, newElement } from '/resources/hyperlib/HyperLib.js';
import { createPopper } from '/resources/node_modules/@popperjs/core/dist/esm/popper.js';
import store from '/resources/es_modules/store2/store2.js';
import cheet from '/resources/es_modules/cheet.js/cheet.js';

let notificationPermission = 'default';
// Check if the browser supports service workers and make sure it supports the features I'm using
if ('serviceWorker' in navigator && 'register' in navigator.serviceWorker && 'controller' in navigator.serviceWorker && 'ready' in navigator.serviceWorker) {
  // If true, the service worker is controlling the site
  if (navigator.serviceWorker.controller) {
    console.log('Service worker is controlling the site.');
    // Add message event listener to get messages from the service worker
    navigator.serviceWorker.addEventListener('message', function(event) {
      console.log(`Got message from service worker: ${event.data}`);
      if (event.data.startsWith('Notification Quick Reply:')) {
        notificationReplyMessage = event.data;
        notificationReplyMessage = notificationReplyMessage.replace(/^(Notification Quick Reply: )/,'');
        sendMessage(notificationReplyMessage);
        return;
      }
    });
    // Send initial message to service worker
    navigator.serviceWorker.controller.postMessage('Initial message to service worker.');
    console.log('Sent message to service worker: Initial message to service worker.')
  }
  // Else, the service worker is not controlling the site and needs to be registered
  else {
    // Register the Service Worker
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    }).then(function(registration) {
      // The service worker registration succeeded, so log it in console
      console.log('Service worker registration succeeded:', registration);
      // Add message event listener to get messages from the service worker
      navigator.serviceWorker.addEventListener('message', function(event) {
        console.log(`Got message from service worker: ${event.data}`);
        if (event.data.startsWith('Notification Quick Reply:')) {
          notificationReplyMessage = event.data;
          notificationReplyMessage = notificationReplyMessage.replace(/^(Notification Quick Reply: )/,'');
          sendMessage(notificationReplyMessage);
          return;
        }
      });
      // Wait for the service worker to be ready
      navigator.serviceWorker.ready.then(function(registration) {
        // Send initial message to service worker
        registration.active.postMessage('Initial message to service worker.');
        console.log('Sent message to service worker: Initial message to service worker.');
      });
    }).catch(function(error) {
      // The service worker registration failed, so show an error in console
      console.error('Service worker registration failed:', error);
    });
  }

  // Set the notification permission variable to the browser's notification permission state if the browser supports notifications.
  if ('Notification' in window && typeof Notification.permission === 'string') {
    notificationPermission = Notification.permission;
  }
}
else {
  console.warn('Service workers are not supported on this browser or browser version. Some features may be disabled!');
}

// eslint-disable-next-line no-unused-vars
function notificationPermissionPrompt() {
  if ('Notification' in window && typeof Notification.permission === 'string') {
    Notification.requestPermission(function(result) {
      return notificationPermission = result;
    });
  }
} // Used to show a permission prompt to grant access to notifications

// Polyfill Intl.ListFormat if necessary
(async () => {
  if (!('ListFormat' in Intl)) {
    await import('/resources/es_modules/intl-list-format/intl-list-format.js');
    await import('/resources/es_modules/intl-list-format/locale-data/en-US.js');
  }
})();

// Define badger class
/**
 * Add notification badge (pill) to favicon in browser tab
 * @url stackoverflow.com/questions/65719387/
 */
 class Badger {
  constructor(options) {
    Object.assign(
      this, {
        backgroundColor: "#f00",
        color: "#fff",
        size: 0.6,      // 0..1 (Scale in respect to the favicon image size)
        position: "ne", // Position inside favicon "n", "e", "s", "w", "ne", "nw", "se", "sw"
        radius: 8,      // Border radius
        src: "",        // Favicon source (dafaults to the <link> icon href)
        onChange() {},
      },
      options
    );
    // this.faviconEl = document.querySelector("link[rel=icon]");
    this.faviconEl = document.querySelector("#favicon");
    this.canvas = document.createElement("canvas");
    this.src = this.src || this.faviconEl.getAttribute("href");
    this.ctx = this.canvas.getContext("2d");
    this.value = 0;
  }

  _drawIcon() {
    this.ctx.clearRect(0, 0, this.faviconSize, this.faviconSize);
    this.ctx.drawImage(this.img, 0, 0, this.faviconSize, this.faviconSize);
  }

  _drawShape() {
    const r = this.radius;
    const xa = this.offset.x;
    const ya = this.offset.y;
    const xb = this.offset.x + this.badgeSize;
    const yb = this.offset.y + this.badgeSize;
    this.ctx.beginPath();
    this.ctx.moveTo(xb - r, ya);
    this.ctx.quadraticCurveTo(xb, ya, xb, ya + r);
    this.ctx.lineTo(xb, yb - r);
    this.ctx.quadraticCurveTo(xb, yb, xb - r, yb);
    this.ctx.lineTo(xa + r, yb);
    this.ctx.quadraticCurveTo(xa, yb, xa, yb - r);
    this.ctx.lineTo(xa, ya + r);
    this.ctx.quadraticCurveTo(xa, ya, xa + r, ya);
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fill();
    this.ctx.closePath();
  }

  _drawVal() {
    const margin = (this.badgeSize * 0.18) / 2;
    this.ctx.beginPath();
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";
    this.ctx.font = `bold ${this.badgeSize * 0.82}px Arial`;
    this.ctx.fillStyle = this.color;
    this.ctx.fillText(this.value, this.badgeSize / 2 + this.offset.x, this.badgeSize / 2 + this.offset.y + margin);
    this.ctx.closePath();
  }

  _drawFavicon() {
    this.faviconEl.setAttribute("href", this.dataURL);
    // For secure tab usage
    parent.postMessage({type: "setFavicon", data: { url: this.dataURL }}, "*");
    // const oldDynamicIcon = document.querySelector("#dynamic-favicon");
    // if (oldDynamicIcon) document.head.removeChild(oldDynamicIcon);

    // const dynamicIcon = this.faviconEl.cloneNode();
    // dynamicIcon.id = "dynamic-favicon";
    // dynamicIcon.href = this.dataURL;
    // document.head.appendChild(dynamicIcon);
  }

  _draw() {
    this._drawIcon();
    if (this.value) this._drawShape();
    if (this.value) this._drawVal();
    this._drawFavicon();
  }

  _setup() {
    this.faviconSize = this.img.naturalWidth;
    this.badgeSize = this.faviconSize * this.size;
    this.canvas.width = this.faviconSize;
    this.canvas.height = this.faviconSize;
    const sd = this.faviconSize - this.badgeSize;
    const sd2 = sd / 2;
    this.offset = {
      n:  {x: sd2, y: 0 },
      e:  {x: sd, y: sd2},
      s:  {x: sd2, y: sd},
      w:  {x: 0, y: sd2},
      nw: {x: 0, y: 0},
      ne: {x: sd, y: 0},
      sw: {x: 0, y: sd},
      se: {x: sd, y: sd},
    }[this.position];
  }

  // Public functions / methods:

  update() {
    // this._value = Math.min(99, parseInt(this._value, 10));
    this._value = Math.min(99, this._value);
    if (this.img) {
      this._draw();
      if (this.onChange) this.onChange.call(this);
    } else {
      this.img = new Image();
      this.img.addEventListener("load", () => {
        this._setup();
        this._draw();
        if (this.onChange) this.onChange.call(this);
      });
      this.img.src = this.src;
    }
  }

  get dataURL() {
    return this.canvas.toDataURL();
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.update();
  }
}

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
let server;
let connected = false;
let typing = false;
let lastTypingTime;
let userListContents;
let serverListContents;
let loggedIn;
let konamiActivated;
let notificationReplyMessage;
let initialLogin = true;
let pageVisible;
let systemTheme;
let emojiPickerLoaded = false;
let usersTypingArray = [];
let hasAllMessageHistory = false;
let defaultServer = 'General'; // Server to use when current server is not set yet
let socket; // Socket.io, placeholder variable until assigned later below.
let supportsWebM = document.createElement('audio').canPlayType('audio/webm') != "";
let badger = new Badger();
let whiteboardList = [];
const highlightWorker = new Worker('/resources/workers/Highlighter.js'); // Web worker for highlighting code blocks in messages

// Initialize sounds for the chat app.
let audioExtension = supportsWebM ? ".webm" : ".mp3";
const chatMessageSound = new Audio(`/resources/assets/ChatMessageSound${audioExtension}`);
const userLeftChatSound = new Audio(`/resources/assets/UserLeftChat${audioExtension}`);
const userJoinedChatSound = new Audio(`/resources/assets/UserJoinedChat${audioExtension}`);
const lostConnectionSound = new Audio(`/resources/assets/LostConnection${audioExtension}`);
const regainedConnectionSound = new Audio(`/resources/assets/RegainedConnection${audioExtension}`);
const stunSound = new Audio(`/resources/assets/Stun${audioExtension}`);
const kickSound = new Audio(`/resources/assets/Kick${audioExtension}`);

const sequences = {
  konami: 'up up down down left right left right b a',
};

cheet(sequences.konami);

cheet.done(function (seq) {
  if (seq === sequences.konami) {
    konamiActivated = !konamiActivated;
  }
});

// Setup code block highlighter for messages
highlightWorker.onmessage = (event) => {
  const { messageId, code } = event.data;
  updateMessageCodeBlock(messageId, code);
}

function isElectron() {
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }
  else {
    return false;
  }
}

if (isElectron()) {
  socket = io('https://hyperchat.dev');
}
else {
  socket = io();
}

// Function to get a css rule
function getCSSRule(ruleName) {
  ruleName = ruleName.toLowerCase();
  let result = null;
  [...document.styleSheets].find(styleSheet => {
    result = [...styleSheet.cssRules].find(cssRule => {
      return cssRule instanceof CSSStyleRule && cssRule.selectorText.toLowerCase() == ruleName;
    });
    return result != null;
  });
  return result;
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
  const previousTheme = store('theme') || 'light';
  grab('body').classList.remove(previousTheme);
  grab('body').classList.add(theme);
  grab('#Message-Box').classList.remove(`${previousTheme}ThemeScrollbar`);
  grab('#Message-Box').classList.add(`${theme}ThemeScrollbar`);
  grab('#messages').classList.remove(`${previousTheme}ThemeScrollbar`);
  grab('#messages').classList.add(`${theme}ThemeScrollbar`);
  grab('#userListContents').classList.remove(`${previousTheme}ThemeScrollbar`);
  grab('#userListContents').classList.add(`${theme}ThemeScrollbar`);
  grab('#Server-List').classList.remove(`${previousTheme}ThemeScrollbar`);
  grab('#Server-List').classList.add(`${theme}ThemeScrollbar`);
  store('theme', theme);
}

if (store('theme') == null) {
  changeTheme(systemTheme); // If the theme is not stored, set the theme to the user's system theme.
}

if (store('theme') == 'light') {
  grab('#lightThemeRadio').checked = true; // Set the light theme radio to checked if the theme is light on page load
  changeTheme('light');
}

if (store('theme') == 'dark') {
  grab('#darkThemeRadio').checked = true; // Set the dark theme radio to checked if the theme is dark on page load
  changeTheme('dark');
}

if (store('theme') == 'custom') {
  grab('#customThemeRadio').checked = true; // Set the custom theme radio to checked if the theme is custom theme on page load
  grab('#custom-theme-picker').show();
  changeTheme('custom');
}

if (store('custom-theme-background-primary')) {
  const customThemeRule = getCSSRule('.custom');
  const primaryBackgroundColor = store('custom-theme-background-primary');
  grab('#custom-theme-background-primary').value = primaryBackgroundColor;
  customThemeRule.style.setProperty('--background-primary', primaryBackgroundColor);
}

if (store('custom-theme-background-secondary')) {
  const customThemeRule = getCSSRule('.custom');
  const secondaryBackgroundColor = store('custom-theme-backgrounad-secondary');
  grab('#custom-theme-background-secondary').value = secondaryBackgroundColor;
  customThemeRule.style.setProperty('--background-secondary', secondaryBackgroundColor);
}

if (store('custom-theme-background-tertiary')) {
  const customThemeRule = getCSSRule('.custom');
  const tertiaryBackgroundColor = store('custom-theme-background-tertiary');
  grab('#custom-theme-background-tertiary').value = tertiaryBackgroundColor;
  customThemeRule.style.setProperty('--background-tertiary', tertiaryBackgroundColor);
}

if (store('custom-theme-header-primary')) {
  const customThemeRule = getCSSRule('.custom');
  const primaryHeaderColor = store('custom-theme-header-primary');
  grab('#custom-theme-header-primary').value = primaryHeaderColor;
  customThemeRule.style.setProperty('--header-primary', primaryHeaderColor);
}

grab('#lightThemeRadio').addEventListener('change', function (event) {
  grab('#custom-theme-picker').hide();
  changeTheme('light'); // Light theme radio chosen, so change the theme to light.
});

grab('#darkThemeRadio').addEventListener('change', function (event) {
  grab('#custom-theme-picker').hide();
  changeTheme('dark'); // Dark theme radio chosen, so change the theme to dark.
});

grab('#customThemeRadio').addEventListener('change', function (event) {
  grab('#custom-theme-picker').show();
  changeTheme('custom');
});

grab('#custom-theme-background-primary').addEventListener('input', function (event) {
  const customThemeRule = getCSSRule('.custom');
  const primaryBackgroundColor = event.target.value;
  customThemeRule.style.setProperty('--background-primary', primaryBackgroundColor);
  store('custom-theme-background-primary', primaryBackgroundColor);
});

grab('#custom-theme-background-secondary').addEventListener('input', function (event) {
  const customThemeRule = getCSSRule('.custom');
  const secondaryBackgroundColor = event.target.value;
  customThemeRule.style.setProperty('--background-secondary', secondaryBackgroundColor);
  store('custom-theme-background-secondary', secondaryBackgroundColor);
});

grab('#custom-theme-background-tertiary').addEventListener('input', function (event) {
  const customThemeRule = getCSSRule('.custom');
  const tertiaryBackgroundColor = event.target.value;
  customThemeRule.style.setProperty('--background-tertiary', tertiaryBackgroundColor);
  store('custom-theme-background-tertiary', tertiaryBackgroundColor);
});

grab('#custom-theme-header-primary').addEventListener('input', function (event) {
  const customThemeRule = getCSSRule('.custom');
  const primaryHeaderColor = event.target.value;
  customThemeRule.style.setProperty('--header-primary', primaryHeaderColor);
  store('custom-theme-header-primary', primaryHeaderColor);
});

// If the server list area state is not set, set it to the original state which depends if the user is on desktop or mobile
if (grab('#Server-List-Area').data('state') == undefined) {
  const originalState = grab('#Server-List-Area').css('--original-state').trim();
  grab('#Server-List-Area').data('state', originalState);
}

// If the user list state is not set, set it to the original state which depends if the user is on desktop or mobile
if (grab('#User-List').data('state') == undefined) {
  const originalState = grab('#User-List').css('--original-state').trim();
  grab('#User-List').data('state', originalState);
}

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
  // All others:
  window.onpageshow = window.onfocus = focused;
  window.onpagehide = window.onblur = unfocused;
}

onVisibilityChange(function(visible) {
  pageVisible = visible;
  // Reset notification counter in tab icon
  if (visible) badger.value = 0;
});

function showSettingsScreen() {
  grab('#settingsScreen').css('opacity', '0');
  grab('#settingsScreen').show();
  setTimeout(() => {
    grab('#settingsScreen').css('opacity', '1');
  }, 1);
  setTimeout(() => {
    grab('#Chat-Screen').hide();
  }, 500);
}

function hideSettingsScreen() {
  grab('#settingsScreen').css('opacity', '1');
  grab('#Chat-Screen').show();
  setTimeout(() => {
    grab('#settingsScreen').css('opacity', '0');
  }, 1);
  setTimeout(() => {
    grab('#settingsScreen').hide();
  }, 500);
  grab('#settingsScreen').removeEventListener('click', showSettingsScreen);
}

function showReconnectingScreen() {
  if (loggedIn) {
    grab('#Chat-Screen').fadeOut();
    grab('#settingsScreen').hide();
    grab('#reconnectingScreen').fadeIn();
  }
  else {
    grab('#loginScreen').fadeOut();
    grab('#reconnectingScreen').fadeIn();
  }
}

function hideReconnectingScreen() {
  if (loggedIn) {
    grab('#reconnectingScreen').fadeOut();
    grab('#Chat-Screen').fadeIn();
  }
  else {
    grab('#reconnectingScreen').fadeOut();
    grab('#loginScreen').fadeIn();
  }
}

// Shows or hides the server list
function toggleServerList() {
  if (grab('#Server-List-Area').data('state') == 'hidden') {
    grab('#Server-List-Area').css('opacity', '1');
    grab('#Server-List-Area').css('transform', 'translateX(0%)');
    grab('#Server-List-Area').data('state', 'shown');
    return 'nowShown';
  }
  else {
    grab('#Server-List-Area').css('opacity', '0');
    grab('#Server-List-Area').css('transform', 'translateX(-100%)');
    grab('#Server-List-Area').data('state', 'hidden');
    return 'nowHidden';
  }
}

// Shows or hides the user list
function toggleUserList() {
  if (grab('#User-List').data('state') == 'hidden') {
    grab('#User-List').css('opacity', '1');
    grab('#User-List').css('transform', 'translateX(0%)');
    grab('#User-List').data('state', 'shown');
    return 'nowShown';
  }
  else {
    grab('#User-List').css('opacity', '0');
    grab('#User-List').css('transform', 'translateX(100%)');
    grab('#User-List').data('state', 'hidden');
    return 'nowHidden';
  }
}

// Shows or hides the server whiteboard
function toggleWhiteboard() {
  if (grab('#Server-Whiteboard').css('display') == 'none') {
    grab('#messages').hide();
    grab('#Bottom-Area').hide();
    grab('#Server-Whiteboard').show();
    recalculateWhiteboardSizes();
    return 'nowShown';
  }
  else {
    grab('#Server-Whiteboard').hide();
    grab('#messages').show();
    grab('#Bottom-Area').show();
    return 'nowHidden';
  }
}

function arrayRemove(array, value) {
  return array.filter(function(ele) {
    return ele != value;
  });
}

// Function to decode html escapes
function decodeHtml(html) {
  let txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Lazy load the emoji picker when the button is clicked
grab('#emoji-button').addEventListener('click', () => {
  // Import the emoji button asyncronously with a dynamic import
  import('/resources/node_modules/@joeattardi/emoji-button/dist/index.js').then(({EmojiButton}) => {
    // Setup the emoji button

    // Set textPosition as a placeholder variable for the user's cursor position in the
    // message box before they click the emoji button
    let messageBoxTextPosition = false;

    // Define button as the emoji button on the page
    const button = document.querySelector('#emoji-button');

    // Set the emoji button options
    const options = {
      style: 'twemoji',
      position: 'left-start'
    }

    // Define picker as emoji picker button with options
    const picker = new EmojiButton(options);

    // When the emoji button is clicked, toggle the emoji picker
    function toggleEmojiPicker() {
      if (getSelection().rangeCount > 0 && getSelection().containsNode(document.querySelector('#Message-Box'))) {
        messageBoxTextPosition = getSelection().getRangeAt(0);
      }

      picker.togglePicker(button);
      grab('.emoji-picker').classList.remove('light', 'dark', 'custom');
      grab('.emoji-picker').classList.add(store('theme'));
      if (picker.isPickerVisible()) {
        currentInput = grab('.emoji-picker');
      }
    }

    button.addEventListener('click', toggleEmojiPicker);

    // Add the emoji to the user's cursor position in the message box when an emoji
    // in the emoji picker is clicked
    picker.on('emoji', selection => {
      const emoji = document.createElement('img');
      emoji.src = selection.url;
      emoji.alt = selection.emoji;
      emoji.className = 'emoji';
      emoji.crossOrigin = 'anonymous';
      if (messageBoxTextPosition) {
        messageBoxTextPosition.insertNode(emoji);
      } else {
        grab('#Message-Box').insertAdjacentElement('beforeend', emoji);
      }
    });

    // When the picker is hidden, focus the message box and change the currentInput
    picker.on('hidden', () => {
      grab('#Message-Box').focus();
      currentInput = grab('#Message-Box');
    });

    // If this is the first time the emoji picker has been loaded (by user clicking), open the emoji picker
    if (!emojiPickerLoaded) {
      toggleEmojiPicker();
      emojiPickerLoaded = true;
    }
  });
}, { once: true });

// Submits the credentials to the server
const submitLoginInfo = () => {
  username = decodeHtml(grab('#usernameInput').value.trim());
  password = decodeHtml(grab('#passwordInput').value.trim());
  server = server || defaultServer;
  // Tell the server your username and password
  socket.emit('login', { username, password, server });
}

// Removes a server from the server list
const removeFromServerList = (server) => {
  for (let serverInServerList of document.querySelectorAll('#Server-List .serverInServerList')) {
    if (serverInServerList.dataset['servername'] === server.ServerName) {
      serverInServerList.remove();
      break;
    }
  }
}

// Adds a server to the server list
const addToServerList = (server) => {
  let serverForServerList = newElement('li');
  serverForServerList.classList.add('serverInServerList');
  serverForServerList.data('servername', server.ServerName);

  let serverIconWrapperForServerList = newElement('span');
  serverIconWrapperForServerList.classList.add('serverIconWrapperInServerList');
  serverIconWrapperForServerList.data('servername', server.ServerName);
  serverIconWrapperForServerList.onclick = (event) => {
    socket.emit('switch server', serverIconWrapperForServerList.getParent().data('servername'));
  }

  let serverIconForServerList = newElement('img');
  serverIconForServerList.classList.add('serverIconInServerList');
  serverIconForServerList.src = `/cdn/ServerIcons/${server.ServerName}.webp`;
  serverIconForServerList.title = server.ServerName;
  serverIconForServerList.alt = server.ServerName;
  serverIconForServerList.draggable = false;

  let deleteServerWrapperForServerList = newElement('span');
  deleteServerWrapperForServerList.classList.add('deleteServerWrapperInServerList');
  deleteServerWrapperForServerList.onclick = (event) => {
    socket.emit('remove server', deleteServerWrapperForServerList.getParent().data('servername'));
  }

  let deleteServerIconForServerList = newElement('img');
  deleteServerIconForServerList.classList.add('deleteServerIconInServerList');
  deleteServerIconForServerList.src = '/resources/assets/DeleteMessageIcon.svg';
  deleteServerIconForServerList.title = 'Delete Server';
  deleteServerIconForServerList.alt = 'Delete Server';
  deleteServerIconForServerList.draggable = false;
  deleteServerIconForServerList.onload = () => SVGInject(deleteServerIconForServerList.getElement());

  serverIconWrapperForServerList.appendChild(serverIconForServerList.getElement());
  serverForServerList.appendChild(serverIconWrapperForServerList.getElement());
  deleteServerWrapperForServerList.appendChild(deleteServerIconForServerList.getElement());
  serverForServerList.appendChild(deleteServerWrapperForServerList.getElement());
  grab('#Server-List').appendChild(serverForServerList.getElement());
}

// Syncs the contents of the server list
const syncServerList = (serverListContents) => {
  for (let server = 0; server < serverListContents.length; server++) {
    if (serverListContents[server] !== undefined) {
      addToServerList(serverListContents[server]);
    }
  }
}

// Sends a chat message
const sendMessage = (message) => {
  socket.emit('new message', message);
}

// Log a message
const log = (message, options) => {
  let messageElement = newElement('li');
  messageElement.classList.add('log')
  messageElement.textContent = message;
  addMessageElement(messageElement, options);
  grab('#messages').scrollTop = grab('#messages').scrollHeight;
}

// Add a user to the user list.
const addToUserList = (user) => {
  const { username, statusMessage } = user;
  // Create the user item
  let userItem = newElement('li');
  userItem.classList.add('userInUserList')
  userItem.data('username', username);

  // Make a new span for the username
  let usernameSpan = newElement('span');
  usernameSpan.classList.add('username');
  usernameSpan.textContent = username;

  // Make a new span for the profile picture span
  let profilePicture = newElement('span');
  profilePicture.classList.add('profilePicture');

  // Make a new img for the profile picture icon
  let profilePictureIcon = newElement('img');
  profilePictureIcon.classList.add('profilePictureIcon');
  profilePictureIcon.src = `/cdn/UserProfilePictures/${username.toLowerCase()}.webp`;
  profilePictureIcon.draggable = false;

  // Add the profile picture icon to the profile picture span
  profilePicture.append(profilePictureIcon);

  // Clone profile picture to use in the user popout
  const userPopoutProfilePicture = profilePicture.cloneNode(true)

  // Make a new popout for the user
  let userPopout = newElement('div');
  userPopout.classList.add('userPopout');
  userPopout.css('display', 'none');
  userPopout.append(userPopoutProfilePicture);

  // Make a new span for the user popout username
  let userPopoutUsername = newElement('span');
  userPopoutUsername.classList.add('userPopoutUsername');
  userPopoutUsername.textContent = username;

  // Make a new span for the user popout info text
  let userPopoutInfoText = newElement('span');
  userPopoutInfoText.classList.add('userPopoutInfoText');
  userPopoutInfoText.textContent = statusMessage;

  // Add the username to the popout
  userPopout.append(userPopoutUsername);

  // Add the info text to the popout
  userPopout.append(userPopoutInfoText);

  // Add a click handler to the user item to popout the user info panel
  userItem.onclick = (event) => {
    if (event.target == userPopout.getElement() || userPopout.getElement().contains(event.target)) {
      return;
    }
    if (userPopout.css('display') == 'flex') {
      return userPopout.css('display', 'none');
    }
    userPopout.css('display', 'flex');
    createPopper(userItem.getElement(), userPopout.getElement(), {
      placement: 'left'
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target != userItem.getElement() && !userItem.contains(event.target)) {
      userPopout.css('display', 'none');
    }
  });

  // Append the profile picture, username, and user popout div to the user li
  userItem.append(profilePicture, usernameSpan, userPopout);

  grab('#userListContents').appendChild(userItem.getElement());
}

// Remove a user from the user list.
const removeFromUserList = (username) => {
  for (let userInUserList of document.querySelectorAll('#User-List .userInUserList')) {
    if (userInUserList.dataset['username'] === username) {
      userInUserList.remove();
      break;
    }
  }
}

// Sync the contents of the user list.
const syncUserList = (userListContents) => {
  for (let user = 0; user < userListContents.length; user++) {
    if (userListContents[user] !== undefined) {
      addToUserList(userListContents[user]);
    }
  }
}

// Replaces a code block in a message with given html
function updateMessageCodeBlock(messageId, code) {
  for (let message of document.querySelectorAll('#messages .message')) {
    if (message.dataset['messageid'] === messageId) {
      message.querySelector('.messageBody code').innerHTML = code;
      break;
    }
  }
}

// Highlights code in code blocks in a message
function highlightMessage(messageId, code) {
  highlightWorker.postMessage({messageId, code});
}

// Adds the visual chat message to the message list
const addChatMessage = (data, options) => {
  // Make sure option properties are set
  if (options != null) {
    if (!options.prepend) {
      options.prepend = false;
    }
    if (!options.previousSameAuthor) {
      options.previousSameAuthor = false;
    }
  } else {
    options = { prepend: false, previousSameAuthor: false };
  }

  // Make a new span for the profile picture span
  let profilePicture = newElement('span');
  profilePicture.classList.add('profilePicture');

  // Make a new img for the profile picture icon
  let profilePictureIcon = newElement('img');
  profilePictureIcon.classList.add('profilePictureIcon');
  profilePictureIcon.src = `/cdn/UserProfilePictures/${data.username.toLowerCase()}.webp`;
  profilePictureIcon.draggable = false;

  // Add the profile picture icon to the profile picture span
  profilePicture.append(profilePictureIcon);

  // Make a new span for the username
  let usernameSpan = newElement('span');
  usernameSpan.classList.add('username')
  usernameSpan.textContent = data.username;
  // If the message is special, set a special username color
  if (data.special) {
    usernameSpan.style.color = data.usernameColor || '#00b0f4';
  }
  // Otherwise, just continue and use the normal getUsernameColor()
  else {
    usernameSpan.style.color = getUsernameColor(data.username);
  }

  // Clone profile picture to use in the user popout
  const userPopoutProfilePicture = profilePicture.cloneNode(true)

  // Make a new popout for the user
  let userPopout = newElement('div');
  userPopout.classList.add('userPopout');
  userPopout.css('display', 'none');
  userPopout.append(userPopoutProfilePicture);

  // Make a new span for the user popout username
  let userPopoutUsername = newElement('span');
  userPopoutUsername.classList.add('userPopoutUsername');
  userPopoutUsername.textContent = data.username;

  // Make a new span for the user popout info text
  let userPopoutInfoText = newElement('span');
  userPopoutInfoText.classList.add('userPopoutInfoText');
  userPopoutInfoText.textContent = 'TODO: Implement status messages in chat message popouts';

  // Add the username to the popout
  userPopout.append(userPopoutUsername);

  // Add the info text to the popout
  userPopout.append(userPopoutInfoText);

  // Add a click handler to the profile picture to popout the user info panel
  profilePicture.onclick = (event) => {
    if (userPopout.css('display') == 'flex') {
      return userPopout.css('display', 'none');
    }
    userPopout.css('display', 'flex');
    createPopper(profilePicture.getElement(), userPopout.getElement(), {
      placement: 'right'
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target != profilePicture.getElement() && !profilePicture.contains(event.target) && event.target != userPopout.getElement() && !userPopout.contains(event.target)) {
      userPopout.css('display', 'none');
    }
  });

  let userBadge;
  // If the message is special, add the badge from the badge property
  if (data.special) {
    // Make a new span for the user badge
    userBadge = newElement('span');
    userBadge.classList.add('userBadge');
    userBadge.css('background-color', data.badgeColor || '#7289da')
    userBadge.textContent = data.badge;
  }

  // Make a new span showing when the message was sent
  let timestamp = newElement('span');
  timestamp.classList.add('timestamp');
  timestamp.textContent = new Date(data.timestamp).toLocaleString();

  let messageBodyDiv = newElement('div');
  messageBodyDiv.classList.add('messageBody');
  messageBodyDiv.innerHTML = data.message;
  messageBodyDiv.querySelectorAll('.mention-text').forEach((element) => {
    const mentionedUsername = element.textContent.substring(1);
    let mentionElement = newElement('span');
    mentionElement.classList.add('mention-text');
    mentionElement.textContent = `@${mentionedUsername}`;
    element.onclick = (event) => {
      grab('#Message-Box').appendChild(mentionElement.getElement());
      currentInput = grab('#Message-Box');
      setCursorToEnd(grab('#Message-Box').getElement());
    }
  });
  messageBodyDiv.querySelectorAll('a').forEach((element) => {
    if (element.href) {
      socket.emit('request link preview', data.messageId, element.href);
    }
  });
  let whiteboard;
  if (messageBodyDiv.querySelector('canvas') != null && messageBodyDiv.querySelector('canvas').classList.contains('whiteboard')) {
    whiteboard = new Whiteboard(messageBodyDiv.querySelector('canvas'));
    whiteboardList.push(whiteboard);
  }

  let messageItem = newElement('li');
  messageItem.classList.add('message');
  messageItem.data('username', data.username);
  messageItem.data('messageid', data.messageId);

  // Make a new span for the delete message button
  let deleteButton = newElement('span');
  deleteButton.classList.add('deleteMessageButton');
  deleteButton.onclick = (event) => {
    socket.emit('delete message', deleteButton.getParent().data('messageid'));
  }

  // Make a new img for the delete message icon
  let deleteIcon = newElement('img');
  deleteIcon.classList.add('deleteMessageIcon');
  deleteIcon.src = '/resources/assets/DeleteMessageIcon.svg';
  deleteIcon.draggable = false;
  deleteIcon.onload = () => SVGInject(deleteIcon.getElement());

  // Add the delete icon to the delete button
  deleteButton.append(deleteIcon);

  // Reactions n' stuff

  // Define picker as reaction picker button with options
  let picker;

  // Make a new span for the reaction message button
  let reactionButton = newElement('span');
  reactionButton.classList.add('reactToMessageButton');
  reactionButton.onclick = (event) => {
    import('/resources/node_modules/@joeattardi/emoji-button/dist/index.js').then(({EmojiButton}) => {
      // Setup the reaction button
  
      // Set textPosition as a placeholder variable for the user's cursor position in the
      // message box before they click the reaction button
      // Define button as the reaction button on the page
      const button = event.target;
  
      // Set the reaction button options
      const options = {
        style: 'twemoji',
        position: 'left-start'
      }

      if (picker == null) picker = new EmojiButton(options);
  
      // When the reaction button is clicked, toggle the reaction picker
      function toggleEmojiPicker() {
        picker.togglePicker(button);
        grab('.emoji-picker').classList.remove('light', 'dark', 'custom');
        grab('.emoji-picker').classList.add(store('theme'));
        if (picker.isPickerVisible()) {
          currentInput = grab('.emoji-picker');
        }
      }

      toggleEmojiPicker();
  
      // Add the reaction to the user's cursor position in the message box when an emoji
      // in the reaction picker is clicked
      picker.on('emoji', selection => {
        // const emoji = document.createElement('img');
        // emoji.src = selection.url;
        // emoji.alt = selection.emoji;
        // emoji.className = 'emoji';
        // emoji.crossOrigin = 'anonymous';
        socket.emit('add reaction', { url: selection.url, name: selection.emoji, messageId: data.messageId });
      });
  
      // When the picker is hidden, focus the message box and change the currentInput
      picker.on('hidden', () => {
        // const pickerElement = document.querySelector('.emoji-picker__wrapper');
        // pickerElement.remove();
      });
    });
  }

  // Make a new img for the reaction message icon
  let reactionIcon = newElement('img');
  reactionIcon.classList.add('reactToMessageIcon');
  reactionIcon.src = 'https://twemoji.maxcdn.com/v/13.0.0/svg/1f60e.svg';
  reactionIcon.draggable = false;
  reactionIcon.crossOrigin = 'anonymous';
  reactionIcon.onload = () => SVGInject(reactionIcon.getElement());

  // Add the reaction icon to the reaction button
  reactionButton.append(reactionIcon);

  // If the message mentions the user, add the mention class
  if (data.message.includes(`@${username}`)) {
    messageItem.classList.add('mention');
  }

  // Compare the authors of the previous message and this one to see if they are the same, and if so, group them
  if (options.previousSameAuthor) {
    messageItem.classList.add('previousSameAuthor');
  }

  // If the message is special, add the special class and append the badge
  if (data.special) {
    messageItem.classList.add('special');
    messageItem.append(profilePicture, userPopout, usernameSpan, userBadge, timestamp, reactionButton, deleteButton, messageBodyDiv);
  }
  // Otherwise, just continue like normal
  else {
    messageItem.append(profilePicture, userPopout, usernameSpan, reactionButton, deleteButton, timestamp, messageBodyDiv);
  }

  // Asynchronously highlight code in a code block in the message if there is one - TODO: Highlight ALL code blocks in the message
  if (messageBodyDiv.querySelector('code') != null) {
    highlightMessage(data.messageId, messageBodyDiv.textContent);
  }

  addMessageElement(messageItem, { prepend: options.prepend });
  if (whiteboard) {
    fitCanvasToParent(whiteboard.canvas);
  }
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
    let element = newElement('span');
    element.classList.add('typing');
    element.textContent = usersTypingText;
    grab('#User-Is-Typing-Area').innerHTML = element.outerHTML;
  }
  else {
    grab('#User-Is-Typing-Area').innerHTML = '';
  }
}

// Function to set the cursor to the end of a content editable element
function setCursorToEnd(target) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(target);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  target.focus();
  range.detach();
  target.scrollTop = target.scrollHeight;
}

// Function to clear the user list
function clearUserList() {
  const userListContents = document.getElementById('userListContents');
  while (userListContents.firstChild) {
    userListContents.removeChild(userListContents.firstChild);
  }
}

// Function to clear the server list
function clearServerList() {
  const serverListContents = document.getElementById('Server-List');
  while (serverListContents.firstChild) {
    serverListContents.removeChild(serverListContents.firstChild);
  }
}

// Function to clear messages
function clearMessages() {
  const messageListContents = document.getElementById('messages');
  while (messageListContents.firstChild) {
    messageListContents.removeChild(messageListContents.firstChild);
  }
}

// Function to remove all typing messages
function clearTypingMessages() {
  syncUsersTyping([]);
}

// Adds a message element to the message list
// element - The element to add as a message
// options.prepend - If the element should prepend
//   all other messages (default = false)
const addMessageElement = (element, options) => {
  // Setup default options
  options = options || {};

  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }

  if (options.prepend) {
    grab('#messages').prepend(element);
  }
  else {
    grab('#messages').append(element);
  }
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

// Helper function to get random color from our color list
function getRandomColorFromList() {
  return colors[Math.floor(Math.random() * colors.length)];
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

grab('#Message-Box').addEventListener('keydown', function (event) {
  if (this.innerHTML.length >= 2000 && !(event.key === 'Backspace' || event.key === 'Delete')) {
    event.preventDefault();
  }
  if (event.key == 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const message = decodeHtml(this.innerHTML);
    if (message.trim() === '') return;
    if (konamiActivated) {
      const color = getRandomColorFromList();
      const coloredMessage = `<span style="color: ${color}">${message}</span>`;
      sendMessage(coloredMessage);
    } else {
      sendMessage(message);
    }
    this.textContent = '';
    socket.emit('stop typing');
    typing = false;
  }
});

grab('#Add-Server-Name-Input').addEventListener('keydown', function (event) {
  if (event.key == 'Enter') {
    event.preventDefault();
    socket.emit('add server', this.value);
    this.value = '';
  }
});

grab('#Add-Server-Name-Input').addEventListener('blur', function (event) {
  currentInput = grab('#Message-Box');
});

document.addEventListener('keydown', (event) => {
  // When the client hits ENTER on their keyboard, they're connected to the socket, and they're not logged in, submit their credentials
  if (event.key == 'Enter' && socket.connected && !loggedIn) {
    submitLoginInfo();
    return;
  }
  if (loggedIn) {
    // Auto-focus the current input when a key is typed
    if (currentInput && !(event.ctrlKey || event.metaKey || event.altKey)) {
      currentInput.focus();
    }
  }
});

grab('#Message-Box').addEventListener('input', updateTyping);

// Set focus to username input when clicked
grab('#usernameInput').addEventListener('click', () => {
  currentInput = grab('#usernameInput');
});

// Set focus to password input when clicked
grab('#passwordInput').addEventListener('click', () => {
  currentInput = grab('#passwordInput');
});

// Set focus to server input when clicked
grab('#Add-Server-Name-Input').addEventListener('click', () => {
  currentInput = grab('#Add-Server-Name-Input');
});

// Focus input when clicking on the message input's border
grab('#Message-Box').addEventListener('click', () => {
  currentInput = grab('#Message-Box');
});

// Go to the settings page when the settings icon on the chat page is clicked
grab('#settingsIconWrapperInChat').addEventListener('click', showSettingsScreen);

// Go to the chat page when the settings icon in settings is clicked
grab('#settingsIconWrapperInSettings').addEventListener('click', hideSettingsScreen);

// Show the notification permission prompt when the notification bell is clicked
grab('#notificationBellWrapper').addEventListener('click', notificationPermissionPrompt);

// Toggle server list slide-out drawer when the server list icon is tapped on mobile
grab('#serverListIconWrapper').addEventListener('click', toggleServerList);

// Toggle user list slide-out drawer when the user list icon is tapped on mobile
grab('#userListIconWrapper').addEventListener('click', toggleUserList);

// Toggle the whiteboard when the whiteboard icon is clicked
grab('#whiteboardIconWrapper').addEventListener('click', toggleWhiteboard);

// Open profile picture uploader when the preview in settings is clicked
grab('#profilePicturePreview').addEventListener('click', () => {
  grab('#profilePictureUpload').click();
});

// Update profile picture preview and send server new profile picture when a profile picture is chosen
grab('#profilePictureUpload').addEventListener('change', function() {
  if (this.files && this.files[0]) {
    grab('#profilePicturePreview').src = URL.createObjectURL(this.files[0]);

    const reader = new FileReader();
    reader.onload = function() {
      const profilePictureArrayBuffer = this.result;
      socket.emit('upload profile picture', profilePictureArrayBuffer);
    }
    reader.readAsArrayBuffer(this.files[0]);
  }
});

grab('#messages').addEventListener('scroll', function() {
  if (this.scrollHeight > this.clientHeight && this.scrollTop == 0 && !hasAllMessageHistory) {
    socket.emit('request more messages', this.querySelectorAll(':scope>.message').length);
  }
});

// Socket events

socket.on('login authorized', () => {
  if (initialLogin) {
    grab('#loginScreen').fadeOut();
    grab('#Chat-Screen').fadeIn();
    currentInput = grab('#Message-Box');
    connected = true;
    loggedIn = true;
    // Display the welcome message
    log(`Welcome to ${server}!`, {
      prepend: true
    });
  }
  grab('#profilePicturePreview').src = `/cdn/UserProfilePictures/${username.toLowerCase()}.webp`;
});

// If the login has been denied...
socket.on('login denied', (data) => {
  const loginDeniedReason = data.loginDeniedReason;
  alert(loginDeniedReason);
  location.reload();
});

// If the server switch has been denied...
socket.on('server switch denied', (data) => {
  const switchServerDeniedReason = data.switchServerDeniedReason;
  alert(switchServerDeniedReason);
  location.reload();
});

socket.on('user list', (userListContents) => {
  syncUserList(userListContents);
});

socket.on('server list', (serverListContents) => {
  syncServerList(serverListContents);
});

socket.on('add server', (server) => {
  addToServerList(server);
});

socket.on('remove server', (server) => {
  removeFromServerList(server);
});

socket.on('delete message', (messageId) => {
  // For all of the messages, iterate over and delete the one that matches the messageId to delete
  grabAll('.message').forEach(function(message) {
    if (message.dataset['messageid'] == messageId) {
      // Ungroup messages that shouldn't be grouped after the message is deleted
      if (message.previousElementSibling != null && message.nextElementSibling != null && message.nextElementSibling.dataset['username'] !== message.previousElementSibling.dataset['username']) {
        message.nextElementSibling.classList.remove('previousSameAuthor');
      }
      message.remove();
    }
  });
});

socket.on('link preview', ({messageId, link, linkPreview}) => {
  grabAll('.message').forEach(function(message) {
    if (message.dataset['messageid'] == messageId) {
      let embed = newElement('div');
      embed.classList.add('embed');

      let embedColorBar = newElement('div');
      embedColorBar.classList.add('embed-color-bar');

      let embedContents = newElement('div');
      embedContents.classList.add('embed-contents');

      let embedTitle = newElement('a');
      embedTitle.classList.add('embed-title');
      embedTitle.textContent = linkPreview.ogTitle;
      embedTitle.href = link;
      embedTitle.target = '_blank';
      embedContents.appendChild(embedTitle.getElement());

      if (linkPreview.ogDescription) {
        let embedDescription = newElement('p');
        embedDescription.classList.add('embed-description');
        embedDescription.textContent = linkPreview.ogDescription;
        embedContents.appendChild(embedDescription.getElement());
      }

      if (linkPreview.ogImage) {
        let embedImage = newElement('img');
        embedImage.classList.add('embed-image');
        embedImage.src = linkPreview.ogImage.url;
        if (embedImage.width && embedImage.height) {
          embedImage.width = linkPreview.ogImage.width + 'px';
          embedImage.height = linkPreview.ogImage.height + 'px';
        }
        embedImage.onerror = function() {
          this.remove();
        }
        embedContents.appendChild(embedImage.getElement());
      }

      embed.append(embedColorBar.getElement(), embedContents.getElement());

      message.appendChild(embed.getElement());

      if (grab('#messages').isUserNearBottom(500)) {
        grab('#messages').scrollToBottom();
      }
    }
  });
});

socket.on('mute', () => {
  grab('#Message-Box').contentEditable = false;
  alert('You are now muted!');
});

socket.on('unmute', () => {
  grab('#Message-Box').contentEditable = true;
  alert('You are now unmuted!');
});

socket.on('flip', () => {
  document.body.style['transform'] = 'rotate(180deg)';
});

socket.on('unflip', () => {
  document.body.style['transform'] = 'rotate(0deg)';
});

socket.on('smash', () => {
  Array.prototype.slice.call(document.querySelectorAll('div,p,span,img,a,body')).map(function (element) {
    element.style['transform'] = 'rotate(' + (Math.floor(Math.random() * 10) - 1) + 'deg)';
  });
});

socket.on('unsmash', () => {
  Array.prototype.slice.call(document.querySelectorAll('div,p,span,img,a,body')).map(function (element) {
    element.style['transform'] = 'rotate(0deg)'
  });
});

socket.on('kick', (reason) => {
  kickSound.play();
  if (reason == null) {
    alert('You have been kicked by an admin.');
  } else {
    alert(`You have been kicked for ${reason}.`);
  }
  location.reload();
});

socket.on('ban', (reason) => {
  kickSound.play();
  if (reason == null) {
    alert('You have been banned by an admin.');
  } else {
    alert(`You have been banned for ${reason}.`);
  }
  location.reload();
});

socket.on('stun', () => {
  stunSound.play();
});

socket.on('open', () => {
  window.open('https://www.google.com', '_blank');
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', (data) => {
  let previousSameAuthor = false; // Initialize previousSameAuthor as false until changed
  if (grab('#messages').lastElementChild != null) {
    const previousMessage = grab('#messages').lastElementChild;
    // Set option to group messages by the same author
    if (data.username === previousMessage.getAttribute('data-username')) {
      previousSameAuthor = true;
    }
  }
  // Add the chat message
  addChatMessage(data, { previousSameAuthor: previousSameAuthor });
  if (data.username !== username && data.message.includes(`@${username}`) && !pageVisible) { // Make sure that the user was mentioned, the message author wasn't the user themself, and the page isn't visible
    // Play chat message sound
    chatMessageSound.play();
    // Set notification count in tab icon
    badger.value++;
    // No html to markdown converter yet because of issues
    // Send notification if we have notification permission
    if (navigator.serviceWorker.controlled && notificationPermission === 'granted') {
      const notificationMessage = data.message;
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(data.username, {
          body: notificationMessage,
          icon: '/resources/assets/favicon.ico',
          vibrate: [200, 100, 200, 100, 200, 100, 200],
          tag: 'pingNotification',
          actions: [
            {action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type your reply...'},
            {action: 'close', title: 'Close notification'}
          ]
        });
      });
    }
  }

  if (grab('#messages').isUserNearBottom(500)) {
    grab('#messages').scrollToBottom();
  }
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', (user) => {
  log(`${user.username} joined the server.`);
  userJoinedChatSound.play();
  addToUserList(user);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', (username) => {
  log(`${username} left the server.`);
  userLeftChatSound.play();
  removeFromUserList(username);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', (username) => {
  usersTypingArray.push(username);
  syncUsersTyping(usersTypingArray);
});

// Whenever the server emits 'stop typing', remove the typing message
socket.on('stop typing', (username) => {
  usersTypingArray = arrayRemove(usersTypingArray, username);
  syncUsersTyping(usersTypingArray);
});

// When the server updates a status message for a user
socket.on('update status message', (user) => {
  const { username, statusMessage } = user;
  for (let userInUserList of document.querySelectorAll('#User-List .userInUserList')) {
    if (userInUserList.dataset['username'] === username) {
      let statusMessageElement = userInUserList.querySelector('.userPopout .userPopoutInfoText');
      statusMessageElement.textContent = statusMessage;
      break;
    }
  }
});

// If the server tells us the server switch was successful, switch server visibly
socket.on('server switch success', (data) => {
  server = data.server;
  clearUserList();
  clearMessages();
  clearTypingMessages();
  // Display the welcome message
  log(`Welcome to ${server}!`, {
    prepend: true
  });
});

socket.on('initial message list', (messages, hasAllMessages) => {
  hasAllMessageHistory = hasAllMessages;
  // Add each message to the message list
  messages.forEach((message, index) => {
    let previousSameAuthor = false; // Initialize previousSameAuthor as false until changed
    if (index > 0) {
      const previousMessage = messages[index - 1];
      // Set option to group messages by the same author
      if (message.username === previousMessage.username) {
        previousSameAuthor = true;
      }
    }
    // Add the chat message
    addChatMessage(message, { previousSameAuthor: previousSameAuthor });
  });
  grab('#messages').scrollToBottom();
});

socket.on('more messages', (messages, endOfMessages) => {
  if (endOfMessages) {
    hasAllMessageHistory = true;
  }
  const previousScrollTop = grab('#messages').scrollHeight - grab('#messages').scrollTop;
  // Prepend messages from the reversed array to the message list
  messages.reverse();
  messages.forEach((message, index) => {
    let previousSameAuthor = false; // Initialize previousSameAuthor as false until changed
    if (index < messages.length -1) {
      const previousInHistoryMessage = messages[index + 1];
      // Set option to group messages by the same author
      if (message.username === previousInHistoryMessage.username) {
        previousSameAuthor = true;
      }
    }
    // Add the chat message
    addChatMessage(message, { prepend: true, previousSameAuthor: previousSameAuthor });
  });
  grab('#messages').scrollTop = grab('#messages').scrollHeight - previousScrollTop;
});

socket.on('new server', () => {
  // If this is a new server, tell the user so
  log('Hi there, welcome to your new server!');
  log('Send the first message!');
});

socket.on('add reaction', ({name, url, messageId}) => {
  grabAll('.message').forEach(function(message) {
    if (message.dataset['messageid'] == messageId) {
      // const emoji = document.createElement('img');
      // emoji.src = selection.url;
      // emoji.alt = selection.emoji;
      // emoji.className = 'emoji';
      // emoji.crossOrigin = 'anonymous';
    }
  });
});

socket.on('disconnect', () => {
  log('You have been disconnected.');
  lostConnectionSound.play();
  showReconnectingScreen();
  connected = false;
});

socket.io.on('reconnect', () => {
  hideReconnectingScreen();
  regainedConnectionSound.play();
  log('You have been reconnected.');
  hasAllMessageHistory = false;
  if (username) {
    initialLogin = false;
    clearUserList();
    clearServerList();
    clearMessages();
    clearTypingMessages();
    socket.emit('login', { username, password, server });
  }
  connected = true;
});

socket.io.on('reconnect_error', () => {
  log('Attempt to reconnect has failed');
});

// White board
// const canvas = document.getElementsByClassName('whiteboard')[0];
// const colors = document.getElementsByClassName('color');
// const context = whiteboard.getContext('2d');

class Whiteboard {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentState = {
      color: 'black'
    }
    this.drawing = false;


    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    canvas.addEventListener('mouseout', (e) => this.onMouseUp(e), false);
    canvas.addEventListener('mousemove', (e) => throttle(this.onMouseMove(e), 10), false);

    // Touch support for mobile devices
    canvas.addEventListener('touchstart', (e) => this.onMouseDown(e), false);
    canvas.addEventListener('touchend', (e) => this.onMouseUp(e), false);
    canvas.addEventListener('touchcancel', (e) => this.onMouseUp(e), false);
    canvas.addEventListener('touchmove', (e) => throttle(this.onMouseMove(e), 10), false);
  }
  

  onDrawingEvent(data) {
    var w = this.canvas.width;
    var h = this.canvas.height;
    this.drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  drawLine(x0, y0, x1, y1, color, emit) {
    const context = this.canvas.getContext('2d');

    if (color == 'black' && document.querySelector('body').classList.contains('dark')) color = 'white';
    
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
  
    if (!emit) { return; }
    var w = this.canvas.width;
    var h = this.canvas.height;
  
    socket.emit('drawing', {
      id: this.canvas.id,
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  onMouseDown(e) {
    if (e.clientX == null && !e.touches.length) return;
    this.drawing = true;
    const rectangle = e.target.getBoundingClientRect();
    this.currentState.x = (e.clientX || e.touches[0].clientX) - rectangle.left;
    this.currentState.y = (e.clientY || e.touches[0].clientY) - rectangle.top;
  }
  
  onMouseUp(e) {
    if (!this.drawing) { return; }
    if (e.clientX == null && !e.touches.length) return;
    this.drawing = false;
    const rectangle = e.target.getBoundingClientRect();
    this.drawLine(this.currentState.x, this.currentState.y, (e.clientX || e.touches[0].clientX) - rectangle.left, (e.clientY || e.touches[0].clientY) - rectangle.top, this.currentState.color, true);
  }
  
  onMouseMove(e) {
    if (!this.drawing) { return; }
    if (e.clientX == null && !e.touches.length) return;
    const rectangle = e.target.getBoundingClientRect();
    this.drawLine(this.currentState.x, this.currentState.y, (e.clientX || e.touches[0].clientX) - rectangle.left, (e.clientY || e.touches[0].clientY) - rectangle.top, this.currentState.color, true);
    this.currentState.x = (e.clientX || e.touches[0].clientX) - rectangle.left;
    this.currentState.y = (e.clientY || e.touches[0].clientY) - rectangle.top;
  }
  
  onColorUpdate(e) {
    this.currentState.color = e.target.className.split(' ')[1];
  }
}

// for (var i = 0; i < colors.length; i++){
//   colors[i].addEventListener('click', onColorUpdate, false);
// }

socket.on('drawing', (data) => {
  // const canvas = document.getElementsByClassName(`whiteboard-${data.id}`)[0];
  const whiteboard = whiteboardList.find(whiteboard => whiteboard.canvas.id === data.id);
  if (whiteboard != null) whiteboard.onDrawingEvent(data);
});

// limit the number of events per second
function throttle(callback, delay) {
  var previousCall = new Date().getTime();
  return function() {
    var time = new Date().getTime();

    if ((time - previousCall) >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

whiteboardList.push(new Whiteboard(document.querySelector('#Server-Whiteboard')));

window.addEventListener('resize', recalculateWhiteboardSizes, false);

function fitCanvasToParent(canvas) {
  canvas.width = canvas.parentElement.offsetWidth || canvas.parentElement.clientWidth || getComputedStyle(canvas.parentElement)['max-width'] || getComputedStyle(canvas.parentElement).width;
  canvas.height = canvas.parentElement.offsetHeight || canvas.parentElement.clientWidth || getComputedStyle(canvas.parentElement)['max-height'] || getComputedStyle(canvas.parentElement).height;
}

function recalculateWhiteboardSizes() {
  for (const whiteboard of whiteboardList) {
    fitCanvasToParent(whiteboard.canvas);
  }
}

recalculateWhiteboardSizes();