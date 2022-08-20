/**
 * Util Module to handle setting a status message for a user (handled on the server right now, no event emitted by client)
 * @module Add Reactions
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.net> and Nolski
 * @copyright Justsnoopy30 2022
 * @license AGPL-3.0
 */

function handleAddReaction({io, socket, emojiURL, emojiName, messageId}) {
  // Type and null check
  if (emojiURL == null || emojiName == null || messageId == null || typeof emojiName !== 'string' || typeof emojiURL !== 'string' || typeof messageId !== 'string') {
    return;
  }

  // TODO: Save to database

  io.in(socket.server).emit('add reaction', {
    messageId: messageId, 
    emojiName: emojiName, 
    emojiURL: emojiURL
  });
}
// Export the addReaction function as the default export
export default handleAddReaction;
