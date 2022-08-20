/**
 * Module to handle the socket delete message event.
 * @module Socket Delete Message Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

import { admins } from '../../../Server.js';

function handleDeleteMessage({io, socket, messageId}) {
  // Null or wrong type check
  if (messageId == null || messageId === '' || typeof messageId !== 'string') {
    return;
  }
  global.messageModel.findOne({server: socket.server, messageId: messageId}, function (error, message) {
    if (message == null) {
      return console.warn(`Requested message to delete by ${socket.username} does not exist in database! ID: ${messageId}`)
    }
    if (error) {
      return console.error(`An error occured while trying to delete the message with messageId: ${messageId} in server: ${socket.server}: ${error}`);
    }
    if (socket.username != message.username && !admins.includes(socket.username.toLowerCase())) {
      return;
    }
    io.in(socket.server).emit('delete message', messageId);
    message.remove();
  });
}

// Export the handleDeleteMessage function as the default export
export default handleDeleteMessage;
