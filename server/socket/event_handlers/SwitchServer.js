
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
  global.userListContents[socket.server] = arrayRemove(global.userListContents[socket.server], socket.username);
  // Echo globally in the server that this user has left
  socket.to(socket.server).emit('user left', socket.username);
  // Change the user's server to the requested server
  socket.server = server;
  // Join the user to their requested server
  socket.join(socket.server);
  // Tell the client that the server switch request has succeeded
  socket.emit('server switch success', {
    server: socket.server
  });
  // Echo to the server that a person has connected
  socket.to(socket.server).emit('user joined', socket.username);
  // Create the user list contents for the server if it doesn't exist
  if (typeof global.userListContents[socket.server] == 'undefined') {
    global.userListContents[socket.server] = [];
  }
  // Add the user to the user list contents for their server
  global.userListContents[socket.server].push(socket.username);

  // Send the user list contents to the user for their server
  socket.emit('user list', global.userListContents[socket.server]);

  // Count amount of servers in the database with the server name the user is in
  global.serverModel.countDocuments({serverName: socket.server}, function(error, count) {
    // Server is already in the database, so send the client the initial message list and return
    if (count > 0) {
      global.messageModel.countDocuments({server: socket.server}).then((count) => {
        if (count > 50) {
          global.messageModel.find({server: socket.server}).skip(count - 50).limit(50).then((messages) => {
            // Send the initial message list to the client (array of messages)
            socket.emit('initial message list', messages, false);
          }).catch((error) => {
            // Catch and show an error in console if there is one
            console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
          });
        } else {
          global.messageModel.find({server: socket.server}).limit(50).then((messages) => {
            // Send the initial message list to the client (array of messages)
            socket.emit('initial message list', messages, true);
          }).catch((error) => {
            // Catch and show an error in console if there is one
            console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
          });
        }
      }).catch((error) => {
        // Catch and show an error in console if there is one
        console.error(`An error occurred while attempting to fetch the message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
      });
      return;
    }
    // Else, make a new entry of the server
    else {
      // Create the mongoose document for a server using the server model
      const serverDocument = new global.serverModel({
        serverName: socket.server,
        serverOwner: socket.username
      });

      // Save the server in the database
      serverDocument.save(function (error, server) {
        if (error) console.error(`An error occurred while attempting to save the server ${socket.server} created by ${socket.username} to the database: ${error}`);
      });

      // Tell the user this is a new server
      socket.emit('new server');
    }
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
