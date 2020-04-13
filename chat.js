if ('serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller) {
    console.log("Service worker is controlling the site.");
    console.log("Sent \"Initial message to service worker.\" to service worker.")
    navigator.serviceWorker.controller.postMessage("Initial message to service worker.");
  }
  else {
    // Register the ServiceWorker
    navigator.serviceWorker.register('service-worker.js', {
      scope: './'
    });
    console.log("Service worker registered on the site.")
  }

  if ('Notification' in window) {
    var notificationPermission = Notification.permission;

    function notificationPermissionPrompt() {
      Notification.requestPermission(function(result) {
        if (result === 'granted') {
          notificationPermission = 'granted';
        }
      });
    }
  }
}

var fadeTime = 150; // In ms
var typingTimerLength = 1000; // In ms
var colors = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
]; // Colors for usernames

// Initialize variables
var currentInput; // Current input focus variable
var username;
var password;
var room;
var connected = false;
var typing = false;
var lastTypingTime;
var userListContents;
var loggedIn;
var cheatActivated;
var notificationReplyMessage;
var initialLogin = true;
var darkThemeSwitchState;
var pageVisible;
var systemTheme;
const converter = new showdown.Converter({tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, backslashEscapesHTMLTags: true, ghMentions: true});

var chatMessageSound = new Audio('./assets/ChatMessageSound.mp3');
var userLeftChatSound = new Audio('./assets/UserLeftChat.mp3');
var userJoinedChatSound = new Audio('./assets/UserJoinedChat.mp3');
var lostConnectionSound = new Audio('./assets/LostConnection.mp3');
var regainedConnectionSound = new Audio('./assets/RegainedConnection.mp3');
var stunSound = new Audio('./assets/Stun.mp3');
var kickSound = new Audio('./assets/Kick.mp3');

var sequences = {
  primary: 'up up down down left right left right b a',
};

cheet(sequences.primary);

cheet.done(function (seq) {
  if (seq === sequences.primary) {
    cheatActivated = true
  }
});

const socket = io();

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  systemTheme = 'dark';
}
else {
  systemTheme = 'light';
}

const changeTheme = (theme) => {
  if (theme == 'light') {
    store('theme', 'light');
    $('body').css({
      "background-color": "#fff",
      "color": "#212529"
    })
    $('#inputMessage').css({
      "background-color": "#fff",
      "color": "#212529"
    })
    $('.settingsIcon').attr('src','./assets/BlackSettingsIcon.png');
    $('#notificationBell').attr('src','./assets/BlackNotificationBell.png');
    $('#settingsTopBar').removeClass('navbar-dark bg-dark');
    $('#settingsTopBar').addClass('navbar-light bg-light');
    $('#inputMessage').removeClass("darkThemeScrollbar").addClass("lightThemeScrollbar");
    $('#messages').removeClass("darkThemeScrollbar").addClass("lightThemeScrollbar");
  }
  if (theme == 'dark') {
    store('theme', 'dark');
    $('body').css({
      "background-color": "#36393f",
      "color": "#fff"
    });
    $('#inputMessage').css({
      "background-color": "#40444b",
      "color": "#fff"
    });
    $('.settingsIcon').attr('src','./assets/WhiteSettingsIcon.png');
    $('#notificationBell').attr('src','./assets/WhiteNotificationBell.png');
    $('#settingsTopBar').removeClass('navbar-light bg-light');
    $('#settingsTopBar').addClass('navbar-dark bg-dark');
    $('#inputMessage').removeClass('lightThemeScrollbar').addClass('darkThemeScrollbar');
    $('#messages').removeClass('lightThemeScrollbar').addClass('darkThemeScrollbar');
  }
}

if (store('theme') == null) {
  store('theme', systemTheme);
}

if (store('theme') == 'light') {
  $('#lightThemeRadio').prop('checked', true)
  changeTheme('light');
}

if (store('theme') == 'dark') {
  $('#darkThemeRadio').prop('checked', true)
  changeTheme('dark');
}

$('#lightThemeRadio').on('change', function (event) {
  changeTheme('light'); // Light theme radio chosen
});

$('#darkThemeRadio').on('change', function (event) {
  changeTheme('dark'); // Dark theme radio chosen
});

function onVisibilityChange(callback) {
    var visible = true;

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
};

onVisibilityChange(function(visible) {
  pageVisible = visible;
});

function showSettingsPage() {
  $('#chatPage').fadeOut();
  $('#settingsPage').fadeIn();
  $('#chatPage').off('click');
}

function hideSettingsPage() {
  $('#settingsPage').fadeOut();
  $('#chatPage').fadeIn();
  $('#settingsPage').off('click');
}

function showReconnectingPage() {
  if (loggedIn) {
    $('#chatPage').fadeOut();
    $('#reconnectingPage').fadeIn();
    $('#chatPage').off('click');
  }
  else {
    $('#loginPage').fadeOut();
    $('#reconnectingPage').fadeIn();
    $('#loginPage').off('click');
  }
}

function hideReconnectingPage() {
  if (loggedIn) {
    $('#reconnectingPage').fadeOut();
    $('#chatPage').fadeIn();
    $('#reconnectingPage').off('click');
  }
  else {
    $('#reconnectingPage').fadeOut();
    $('#loginPage').fadeIn();
    $('#reconnectingPage').off('click');
  }
}

// Submits the credentials to the server
const submitLoginInfo = () => {
  username = cleanInput($('#usernameInput').val().trim());
  password = cleanInput($('#passwordInput').val().trim());
  room = cleanInput($('#roomInput').val().trim());
  // Tell the server your username, password, and room
  socket.emit('login', { username, password, room });
}

socket.on('login authorized', () => {
  if (initialLogin) {
    $('#loginPage').fadeOut();
    $('#chatPage').fadeIn();
    $('#loginPage').off('click');
    currentInput = $('#inputMessage').focus();
    connected = true;
    loggedIn = true
    // Display the welcome message
    log("Welcome to " + room + '!', {
      prepend: true
    });
  }
});

socket.on('login denied', (data) => {
  loginDeniedReason = data.loginDeniedReason;
  alert(loginDeniedReason);
  location.reload();
});

socket.on('user list', (data) => {
  userListContents = data.userListContents;
  syncUserList(userListContents);
});

socket.on('muted', () => {
	alert('You are muted!');
});

socket.on('flip', (data) => {
  if (data.affectedUsername == username) {
    ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix) {
    	document.body.style[prefix + 'transform'] = 'rotate(180deg)';
    });
  }
});

socket.on('unflip', (data) => {
  if (data.affectedUsername == username) {
    ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix) {
    	document.body.style[prefix + 'transform'] = 'rotate(0deg)';
    });
  }
});

socket.on('stupidify', (data) => {
  if (data.affectedUsername == username) {
    (function(){
    	var TEXT = 'When I looked in the mirror, the reflection showed Joe Mama. Then the mirror screamed, and shattered. '
    	Array.prototype.slice.call(document.querySelectorAll('input,textarea')).map(function(el){
    		el.onkeypress=function(evt){
    			var charCode = typeof evt.which == "number" ? evt.which : evt.keyCode;
    			if (charCode && charCode > 31) {
    				var start = this.selectionStart, end = this.selectionEnd;
    				this.value = this.value.slice(0, start) + TEXT[start % TEXT.length] + this.value.slice(end);
    				this.selectionStart = this.selectionEnd = start + 1;
    			}
    			return false;
    		}
    	});
    }());
  }
});

socket.on('smash', (data) => {
  if (data.affectedUsername == username) {
    ['', '-ms-', '-webkit-', '-o-', '-moz-'].forEach(function(prefix){
    	Array.prototype.slice.call(document.querySelectorAll('div,p,span,img,a,body')).map(function(el){
    		el.style[prefix + 'transform'] = 'rotate(' + (Math.floor(Math.random() * 10) - 1) + 'deg)';
    	});
    });
  }
});

socket.on('kick', (data) => {
  if (data.affectedUsername == username) {
    kickSound.play();
    socket.disconnect();
    alert("You have been kicked from the chatroom.");
    location.reload();
  }
});

socket.on('stun', (data) => {
  if (data.affectedUsername == username) {
    stunSound.play();
  }
});

if ('serviceWorker' in navigator && 'Notification' in window ) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    console.log("Got message from service worker: " + event.data);
    if (event.data.startsWith("Notification Quick Reply:")) {
      notificationReplyMessage = event.data;
      notificationReplyMessage = notificationReplyMessage.replace(/^(Notification Quick Reply\: )/,"");
      sendMessage(notificationReplyMessage);
    }
  });
}

// Sends a chat message
const sendMessage = (message) => {
  // Prevent markup from being injected into the message
  // message = cleanInput(message);
  if (message && connected && !cheatActivated) {
    $('#inputMessage').val('');
    socket.emit('new message', message);
  }
  else if (message && connected && cheatActivated) {
    socket.emit('new message', message);
  }
}
const syncUserList = (userListContents) => {
  var usersToAddToUserList = $();
  for(var x = 0; x < 1000; x++) {
    if (userListContents[x] !== undefined) {
      usersToAddToUserList = usersToAddToUserList.add('<li class="user">' + userListContents[x] + '</li>');
    }
  }
  $('#userList').append(usersToAddToUserList);
}

// Log a message
const log = (message, options) => {
  var $el = $('<li>').addClass('log').text(message);
  addMessageElement($el, options);
}

const addToUserList = (data) => {
  var $user = $('<li>').addClass('user').text(data);
  $('#userList').append($user);
}
const removeFromUserList = (data) => {
  $('li').filter(function() { return $.text([this]) === data; }).remove();
}


// Adds the visual chat message to the message list
const addChatMessage = (data, options) => {
  options = options || {};

  var $usernameDiv = $('<span class="username"></span>')
    .text(data.username)
    .css('color', getUsernameColor(data.username));
  var $messageBodyDiv = $('<span class="messageBody">' + data.message + '</span>')
  var typingClass = data.typing ? 'typing' : '';
  var $messageDiv = $('<li class="message"></li>')
    .data('username', data.username)
    .addClass(typingClass)
    .append($usernameDiv, $messageBodyDiv);

  addMessageElement($messageDiv, options);
}

// Adds the visual chat typing message
const addChatTyping = (data, options) => {
  data.typing = true;
  data.message = 'is typing...';

  // Don't fade the message in if there is an 'X was typing'
  var $typingMessages = getTypingMessages(data);
  options = options || {};
  if ($typingMessages.length !== 0) {
    options.fade = false;
    $typingMessages.remove();
  }

  options.typing = true;

  var $usernameDiv = $('<span class="username"></span>')
    .text(data.username)
    .css('color', getUsernameColor(data.username));
  var $messageBodyDiv = $('<span class="messageBody">' + data.message + '</span>')
  var $messageDiv = $('<li class="typing"></li>')
    .data('username', data.username)
    .append($usernameDiv, $messageBodyDiv);

  addMessageElement($messageDiv, options);
}

// Removes the visual chat typing message
const removeChatTyping = (data) => {
  getTypingMessages(data).fadeOut(function () {
    $(this).remove();
  });
}

// Adds a message element to the messages and scrolls to the bottom
// element - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
const addMessageElement = (element, options) => {
  var $element = $(element);

  // Setup default options
  if (!options) {
    options = {};
  }

  if (typeof options.fade === 'undefined') {
    options.fade = true;
  }
  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }

  // Apply options
  if (options.fade) {
    $element.hide().fadeIn(fadeTime);
  }

  if (options.prepend) {
    if (options.typing) {
      $('#typingMessageArea').prepend($element);
    }
    else {
      $('#messages').prepend($element);
    }
  }
  else {
    if (options.typing) {
      $('#typingMessageArea').append($element);
    }
    else {
      $('#messages').append($element);
    }
  }

  $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
}

// Prevents input from having injected markup
const cleanInput = (input) => {
  return $('<div/>').text(input).html();
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
      var typingTimer = (new Date()).getTime();
      var timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= typingTimerLength && typing) {
        socket.emit('stop typing');
        typing = false;
      }
    }, typingTimerLength);
  }
}

// Gets the 'X is typing' messages of a user
const getTypingMessages = (data) => {
  return $('.typing').filter(function (i) {
    return $(this).data('username') === data.username;
  });
}

// Gets the color of a username through our hash function
const getUsernameColor = (username) => {
  // Compute hash code
  var hash = 7;
  for (var i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  // Calculate color
  var index = Math.abs(hash % colors.length);
  return colors[index];
}

// Keyboard events

$('#inputMessage').on('input', function (event) {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

$('#inputMessage').keydown(function (event) {
  if (event.key=="Enter" && !event.shiftKey) {
    event.preventDefault()
    sendMessage($('#inputMessage').val())
    socket.emit('stop typing');
    typing = false;
    this.style.height = "auto";
  }
});

$(window).keydown(event => {
  if (loggedIn) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)) {
      currentInput.focus();
    }
  }
  // When the client hits ENTER on their keyboard
  if (event.key == 'Enter' && !event.shiftKey && !username) {
    submitLoginInfo();
  }
});

$('#inputMessage').on('input', () => {
  updateTyping();
});

// Set focus to username input when clicked
$('#usernameInput').click(() => {
  currentInput = $('#usernameInput').focus();
});

// Set focus to password input when clicked
$('#passwordInput').click(() => {
  currentInput = $('#passwordInput').focus();
});

// Focus input when clicking on the message input's border
$('#inputMessage').click(() => {
  $('#inputMessage').focus();
});

// Socket events

// Whenever the server emits 'new message', update the chat body
socket.on('new message', (data) => {
  if (data.username !== username) {
    addChatMessage(data);
    chatMessageSound.play();
    if ('navigator.serviceWorker.controller' && notificationPermission === 'granted' && data.message.includes('@' + username)) { // Make sure we have the permission to send notifications and the user was mentioned
      var notificationMessage = converter.makeMarkdown(data.message); // Convert html to markdown for the notification
      navigator.serviceWorker.ready.then(function(registration) {
        registration.showNotification(data.username, {
          body: notificationMessage,
          icon: './favicon.ico',
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
  removeChatTyping(data);
  removeFromUserList(data.username);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', (data) => {
  addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', (data) => {
  removeChatTyping(data);
});

socket.on('disconnect', () => {
  log('You have been disconnected.');
  lostConnectionSound.play();
  showReconnectingPage();
});

socket.on('reconnect', () => {
  hideReconnectingPage();
  regainedConnectionSound.play();
  log('You have been reconnected.');
  if (username) {
    initialLogin = false;
    const userListDivContents = document.getElementById("userList");
    while (userListDivContents.firstChild) {
      userListDivContents.removeChild(userListDivContents.firstChild);
    }
    var userListTitleElement = document.createElement("h3");
    var userListTitleText = document.createTextNode("User List");
    userListTitleElement.appendChild(userListTitleText);
    userListDivContents.appendChild(userListTitleElement);
    socket.emit('login', { username, password, room });
  }
});

socket.on('reconnect_error', () => {
  log('Attempt to reconnect has failed');
});
