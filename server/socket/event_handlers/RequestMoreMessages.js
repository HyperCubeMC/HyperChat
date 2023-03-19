/**
 * Module to handle the socket delete message event.
 * @module Socket Request More Messages Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function handleRequestMoreMessages({io, socket, skipMessages}) {
  if (skipMessages == null) return;
  global.messageModel.countDocuments({server: socket.server}).then((count) => {
    if (count > (skipMessages + 50)) {
      global.messageModel.find({server: socket.server}).skip(count - (skipMessages + 50)).limit(50).then((messages) => {
        // Send the requested messages back to the client (array of messages)
        for (const message of messages) {
          if (message.message == null) {
            console.log(`Deleting null message with id ${message.messageId} sent by ${message.username}`);
            message.deleteOne();
            messages.splice(messages.indexOf(message), 1);
            continue;
          }
          // TODO: remove, temp fix for problem
          if (message.message.includes("<script>")) {
            console.log("found script: " + message);
            message.deleteOne();
            messages.splice(messages.indexOf(message));
          }
        }
        socket.emit('more messages', messages, false);
      }).catch((error) => {
        // Catch and show an error in console if there is one
        console.error(`An error occurred while attempting to fetch more message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
      });
    } else {
      global.messageModel.find({server: socket.server}).limit(50).then((messages) => {
        // Send the requested messages back to the client (array of messages)
        socket.emit('more messages', messages, true);
      }).catch((error) => {
        // Catch and show an error in console if there is one
        console.error(`An error occurred while attempting to fetch more message history for ${socket.username} in server ${socket.server} from the database: ${error}`);
      });
    }
  }).catch((error) => {
    // Catch and show an error in console if there is one
    console.error(`An error occurred while attempting to count the messages for ${socket.username} in server ${socket.server} from the database: ${error}`);
  });
  return;
}

// Export the handleRequestMoreMessages function as the default export
export default handleRequestMoreMessages;
