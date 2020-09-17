/**
 * Module to handle the socket disconnect event.
 * @module Socket Disconnect Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

function handleDisconnect({io, socket}) {
  if (socket.addedUser) {
    // Remove the user from the user list
    global.userListContents[socket.server] = global.arrayRemove(global.userListContents[socket.server], socket.username);
    // Echo globally in the server that this user has left
    socket.to(socket.server).emit('user left', {
      username: socket.username
    });
    // Echo globally in the server that the user has stopped typing, since they left
    socket.to(socket.server).emit('stop typing', {
      username: socket.username
    });
    // Remove the username to socket id map entry for the user
    global.userMap.delete(socket.username);
  }
}

// Export the handleDisconnect function as the default export
export default handleDisconnect;
