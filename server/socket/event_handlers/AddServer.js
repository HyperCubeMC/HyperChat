/**
 * Module to handle the socket add server event.
 * @module Socket Add Server Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function handleAddServer({io, socket, serverName}) {
  // Trim the server name
  serverName = serverName.trim();
  // Null or wrong type check
  if (serverName == null || serverName === ''  || typeof serverName !== 'string') {
    return;
  }
  global.userModel.findOne({username: socket.username.toLowerCase()}, function (error, user) {
    if (user == null) {
      return console.warn(`User ${socket.username} was not in the database when handling the socket Add Server event!`)
    }
    if (error) {
      return console.error(`An error occured while trying to fetch user ${socket.username} from the database while handling the socket Add Server event: ${error}`);
    }
    if (user.serverList.some(server => server.ServerName === serverName)) {
      return; // The user already has the server in their server list, so return
      // TODO: Add user feedback
    }
    const server = {
      ServerName: serverName,
      ServerOwner: 'TODO'
    }
    user.serverList.push(server);
    user.save(function (error, user) {
      if (error) return console.error(`An error occured while trying to add the server ${serverName} to the server list of ${socket.username} in the database: ${error}`);
    });
    socket.emit('add server', server);
  });
}

// Export the handleAddServer function as the default export
export default handleAddServer;
