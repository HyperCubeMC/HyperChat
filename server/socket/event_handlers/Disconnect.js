/**
 * Module to handle the socket disconnect event.
 * @module Socket Disconnect Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function handleDisconnect({io, socket}) {
  if (socket.authenticated) {
    // Echo globally in the server that the user has stopped typing, since they disconnected
    // TODO: In the rare case that two people are typing on the same account on different socket connections
    // this will stop the typing message even if the other connection is still typing, technically a bug
    socket.to(socket.server).emit('stop typing', socket.username);
    // If there are no other connections from the user left, consider the user gone
    if (global.userConnectionsMap.get(socket.username).length == 1) {
      // Remove the user from the user list
      global.userListContents[socket.server] = global.userListContents[socket.server].filter(function(user) {
        return user.username != socket.username;
      });
      // Echo globally to the server that this user has left
      socket.to(socket.server).emit('user left', socket.username);
    }
    // Remove the connection's socket id from the user's connection array
    global.userConnectionsMap.remove(socket.username, socket.id);
  }
}

// Export the handleDisconnect function as the default export
export default handleDisconnect;
