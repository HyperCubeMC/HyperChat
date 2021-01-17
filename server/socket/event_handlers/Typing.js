/**
 * Module to handle the socket typing event.
 * @module Socket Typing Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function handleTyping({io, socket}) {
  socket.to(socket.server).emit('typing', socket.username);
}

// Export the handleTyping function as the default export
export default handleTyping;
