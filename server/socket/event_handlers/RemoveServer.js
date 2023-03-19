/**
 * Module to handle the socket remove server event.
 * @module Socket Remove Server Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function handleRemoveServer({io, socket, serverName}) {
  // Trim the server name
  serverName = serverName.trim();
  // Null or wrong type check
  if (serverName == null || serverName === '' || typeof serverName != 'string') {
    return;
  }
  global.userModel.findOne({username: socket.username.toLowerCase()}).then(user => {
    if (user == null) {
      return console.warn(`User ${socket.username} was not in the database when handling the socket Remove Server event!`)
    }

    const server = {
      ServerName: serverName,
      ServerOwner: 'TODO'
    }
    user.serverList = user.serverList.filter(function(element) {
      return element.ServerName != serverName;
    });
    user.save().catch(error => {
      return console.error(`An error occured while trying to remove the server ${serverName} from the server list of ${socket.username} in the database: ${error}`);
    });
    socket.emit('remove server', server);
  }).catch(error => {
    return console.error(`An error occured while trying to fetch user ${socket.username} from the database while handling the socket Remove Server event: ${error}`);
  });
}

// Export the handleRemoveServer function as the default export
export default handleRemoveServer;
