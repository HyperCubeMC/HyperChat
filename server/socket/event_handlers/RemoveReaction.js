/**
 * Util Module to handle removing a reaction from a message
 * @module Remove Reaction
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.net>
 * @copyright Justsnoopy30 2022
 * @license AGPL-3.0
 */

function handleRemoveReaction({io, socket, messageId, emojiURL, unicodeFallback}) {
  // Type and null check
  if (messageId == null || emojiURL == null || unicodeFallback == null || typeof messageId !== 'string' || typeof emojiURL !== 'string' || typeof unicodeFallback !== 'string') {
    return;
  }

  global.messageModel.findOne({server: socket.server, messageId: messageId}).then(message => {
    if (message == null) {
      return console.warn(`Requested message to react to by ${socket.username} does not exist in database! ID: ${messageId}`)
    }
    
    if (!message.reactions.some(reaction => reaction.username == socket.username && reaction.emojiURL == emojiURL)) return;

    message.reactions = message.reactions.filter(reaction => reaction.username != socket.username || reaction.emojiURL != emojiURL);
    message.save().catch(error => {
      return console.error(`An error occured while trying to remove a reaction from a message with id ${messageId} in the database: ${error}`);
    });

    io.in(socket.server).emit('remove reaction', {
      messageId: messageId, 
      username: socket.username,
      emojiURL: emojiURL,
      unicodeFallback: unicodeFallback
    });
  }).catch(error => {
    return console.error(`An error occured while trying to react to the message with messageId: ${messageId} in server: ${socket.server}: ${error}`);
  });
}
// Export the removeReaction function as the default export
export default handleRemoveReaction;
