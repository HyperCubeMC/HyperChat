/**
 * Module to handle the socket request link preview event.
 * @module Socket Request Link Preview Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

import ogs from 'open-graph-scraper';

const cache = new Map();

function handleRequestLinkPreview({io, socket, messageId, link}) {
  if (!messageId || !link) return;

  if (cache.has(link)) {
    const linkPreview = cache.get(link);
    socket.emit('link preview', { messageId, link, linkPreview });
  } else {
    ogs({ url: link }, (error, linkPreview, response) => {
      if (!error && linkPreview.success) {
        cache.set(link, linkPreview);
        socket.emit('link preview', { messageId, link, linkPreview });
        setTimeout(function() {
          cache.delete(link);
        }, 60000);
      }
    });
  }
}

// Export the handleRequestLinkPreview function as the default export
export default handleRequestLinkPreview;
