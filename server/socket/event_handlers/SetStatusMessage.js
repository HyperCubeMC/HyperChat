/**
 * Util Module to handle setting a status message for a user (handled on the server right now, no event emitted by client)
 * @module Set Status Message
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function setStatusMessage({io, socket, statusMessage}) {
  // Type and null check
  if (statusMessage == null || typeof statusMessage !== 'string') {
    return;
  }

  global.userModel.findOne({username: socket.username.toLowerCase()}).then(user => {
    if (user == null) {
      return console.warn(`User ${socket.username} was not in the database while attempting to set their status message!`);
    }

    user.statusMessage = statusMessage;
    user.save().catch(error => {
      return console.error(`An error occurred while attempting to save the status message of user ${socket.username} to the database: ${error}`);
    });
  }).catch(error => {
    console.error(`An error occurred while trying to fetch user ${socket.username} from the database when attempting to set their status message: ${error}`);
  });

  io.in(socket.server).emit('update status message', {
    username: socket.username,
    statusMessage: statusMessage
  });
}
// Export the setStatusMessage function as the default export
export default setStatusMessage;
