/**
 * Module to handle the socket typing event.
 * @module Socket Typing Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

function handleTyping({io, socket}) {
  io.in(socket.server).emit('typing', {
    username: socket.username
  });
}

// Export the handleTyping function as the default export
export default handleTyping;
