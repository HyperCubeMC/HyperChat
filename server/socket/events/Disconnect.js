/**
 * Module to handle the socket disconnect event.
 * @module Socket Disconnect Event Handler
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

function handleDisconnect({io, socket}) {
  if (socket.addedUser) {
    // Remove the user from the user list
    userListContents[socket.server] = arrayRemove(userListContents[socket.server], socket.username);
    // Echo globally in the server that this user has left
    socket.to(socket.server).emit('user left', {
      username: socket.username
    });
    // Echo globally in the server that the user has stopped typing, since they left
    socket.to(socket.server).emit('stop typing', {
      username: socket.username
    });
    // Remove the username to socket id map entry for the user
    userMap.delete(socket.username);
  }
}

// Export the handleDisconnect function as the default export
export default handleDisconnect;
