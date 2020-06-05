/**
 * Module to handle the socket switch server event.
 * @module Socket Switch Server Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

 // Helper function to return an array with the value specified removed from the passed array
function arrayRemove(array, value) {
  return array.filter(function(element) {
    return element != value;
  });
}

function handleSwitchServer({io, socket, server}) {
  // If the server isn't defined, isn't of type string, or is null, deny the server switch
  if (typeof server !== 'string' || server == null) {
    socket.emit('server switch denied', {
      serverSwitchDeniedReason: 'Invalid server specified.'
    });
    return;
  }
  // Return if the server to switch to is the one the user is already in
  if (server === socket.server) return;
  // Remove the user from their old server
  socket.leave(socket.server);
  // Remove the user from the user list
  global.userListContents[socket.server] = arrayRemove(userListContents[socket.server], socket.username);
  // Echo globally in the server that this user has left
  socket.to(socket.server).emit('user left', {
    username: socket.username
  });
  // Change the user's server to the requested server
  socket.server = server;
  // Join the user to their requested server
  socket.join(socket.server);
  // Tell the client that the server switch request has succeeded
  socket.emit('server switch success', {
    server: socket.server
  });
  // Echo to the server that a person has connected
  socket.to(socket.server).emit('user joined', {
    username: socket.username,
  });
  // Create the user list contents for the server if it doesn't exist
  if (typeof global.userListContents[socket.server] == 'undefined') {
    global.userListContents[socket.server] = [];
  }
  // Add the user to the user list contents for their server
  global.userListContents[socket.server].push(socket.username);
  // Send the user list contents to the user for their server
  socket.emit('user list', {
    userListContents: global.userListContents[socket.server]
  });

  // Create timestamp for usage logging
  const timestamp = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Usage logging
  console.log(`${timestamp} | ${socket.username} joined server: ${socket.server}`);
}

// Export the handleSwitchServer function as the default export
export default handleSwitchServer;
