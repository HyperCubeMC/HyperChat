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

  var notificationPermission = Notification.permission;
}

$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $passwordInput = $('.passwordInput'); // Input for password
  var $roomInput = $('.roomInput'); // Input for chat room
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $userList = $('.userList'); // User list
  var $currentInput // Current input focus variable

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

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

  var sequences = {
    primary: 'up up down down left right left right b a',
  };

  cheet(sequences.primary);

  cheet.done(function (seq) {
    if (seq === sequences.primary) {
      cheatActivated = true
    }
  });

  var socket = io();
  // const addParticipantsMessage = (data) => {
  //   var message = '';
  //   if (data.numUsers === 1) {
  //     message += "There's 1 participant";
  //   } else {
  //     message += "There are " + data.numUsers + " participants";
  //   }
  //   log(message);
  // }

  // Submits the credentials to the server
  const submitLoginInfo = () => {
    username = cleanInput($usernameInput.val().trim());
    password = cleanInput($passwordInput.val().trim());
    room = cleanInput($roomInput.val().trim());
    // Tell the server your username, password, and room
    socket.emit('login', { username, password, room });
  }
  socket.on('login authorized', () => {
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();
    connected = true;
    loggedIn = true
    // Display the welcome message
    log("Welcome to " + room + '!', {
      prepend: true
    });
  });

  socket.on('login denied', (data) => {
    loginDeniedReason = data.loginDeniedReason
    alert(loginDeniedReason)
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
      ['', '-ms-', '-webkit-', '-o-', '-moz-'].map(function(prefix){
      	document.body.style[prefix + 'transform'] = 'rotate(180deg)';
      });
    }
  });

  socket.on('unflip', (data) => {
    if (data.affectedUsername == username) {
      ['', '-ms-', '-webkit-', '-o-', '-moz-'].map(function(prefix){
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
      ['', '-ms-', '-webkit-', '-o-', '-moz-'].map(function(prefix){
      	Array.prototype.slice.call(document.querySelectorAll('div,p,span,img,a,body')).map(function(el){
      		el.style[prefix + 'transform'] = 'rotate(' + (Math.floor(Math.random() * 10) - 1) + 'deg)';
      	});
      });
    }
  });

  if (navigator.serviceWorker.controller) {
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
      $inputMessage.val('');
      socket.emit('new message', message);
    }
    else if (message && connected && cheatActivated) {
      socket.emit('new message', message);
    }
  }
  const syncUserList = (userListContents) => {
    var usersToAddToUserList = $();
    for(x = 0; x < 1000; x++) {
      if (userListContents[x] !== undefined) {
        usersToAddToUserList = usersToAddToUserList.add('<li class="user">' + userListContents[x] + '</li>');
      }
    }
    $userList.append(usersToAddToUserList);
  }

  // Log a message
  const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  const addToUserList = (data) => {
    var $user = $('<li>').addClass('user').text(data);
    $userList.append($user);
  }
  const removeFromUserList = (data) => {
    $('li').filter(function() { return $.text([this]) === data; }).remove();
  }


  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    var converter = new showdown.Converter({tables: true, strikethrough: true, emoji: true, underline: true, simplifiedAutoLink: true, encodeEmails: false, openLinksInNewWindow: true, simpleLineBreaks: true, ghMentions: true, ghMentionsLink: '/chat'});
    markdownMessage = converter.makeHtml(data.message);
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">' + markdownMessage)
      // .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

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
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
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
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
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
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(event => {
    if (loggedIn) {
      // Auto-focus the current input when a key is typed
      if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        $currentInput.focus();
      }
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage($inputMessage.val())
        socket.emit('stop typing');
        typing = false;
      } else {
        submitLoginInfo();
      }
    }
  });

  $inputMessage.on('input', () => {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  // $loginPage.click(() => {
  //  $currentInput.focus();
  // });

  // Set focus to username input when clicked
  $usernameInput.click(() => {
    $currentInput = $usernameInput.focus();
  });

  // Set focus to password input when clicked
  $passwordInput.click(() => {
    $currentInput = $passwordInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    if (data.username !== username) {
      addChatMessage(data);
      var newMessageSound = new Audio('ChatMessageSound.mp3');
      newMessageSound.play();
      if ('navigator.serviceWorker.controller' && notificationPermission === 'granted') {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.showNotification(data.username, {
            body: data.message,
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
    log(data.username + ' joined');
    // addParticipantsMessage(data);
    addToUserList(data.username);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' left');
    // addParticipantsMessage(data);
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
    log('You have been disconnected');
  });

  socket.on('reconnect', () => {
    log('You have been reconnected');
    if (username) {
      const userListDivContents = document.getElementsByClassName("userList")[0];
      while (userListDivContents.firstChild) {
        userListDivContents.removeChild(userListDivContents.firstChild);
      }
      var userListTitleElement = document.createElement("h3");
      var userListTitleText = document.createTextNode("User List");
      userListTitleElement.appendChild(userListTitleText);
      userListDivContents.appendChild(userListTitleElement);
      submitLoginInfo();
    }
  });

  socket.on('reconnect_error', () => {
    log('Attempt to reconnect has failed');
  });

});
