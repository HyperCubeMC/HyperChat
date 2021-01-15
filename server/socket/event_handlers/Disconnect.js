/**
 * Module to handle the socket disconnect event.
 * @module Socket Disconnect Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

function handleDisconnect({io, socket}) {
  if (socket.authenticated) {
    // Echo globally in the server that the user has stopped typing, since they disconnected
    socket.to(socket.server).emit('stop typing', socket.username);
    // Remove the user from the user list
    global.userListContents[socket.server] = global.userListContents[socket.server].filter(function(user) {
      return user.username != socket.username;
    });
    // Echo globally in the server that this user has left
    socket.to(socket.server).emit('user left', socket.username);
    // Remove the username to socket id map entry for the user
    global.userMap.delete(socket.username);
  }
}

// Export the handleDisconnect function as the default export
export default handleDisconnect;
