self.addEventListener('install', function(event) {
  // Put `offline.html` page into cache
  var offlineRequest = new Request('offline.html');
  event.waitUntil(
    fetch(offlineRequest).then(function(response) {
      return caches.open('offline').then(function(cache) {
        console.log('[oninstall] Cached offline page', response.url);
        return cache.put(offlineRequest, response);
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Only fall back for HTML documents.
  var request = event.request;
  // && request.headers.get('accept').includes('text/html')
  if (request.method === 'GET') {
    // `fetch()` will use the cache when possible, to this examples
    // depends on cache-busting URL parameter to avoid the cache.
    event.respondWith(
      fetch(request).catch(function(error) {
        // `fetch()` throws an exception when the server is unreachable but not
        // for valid HTTP responses, even `4xx` or `5xx` range.
        console.error(
          '[onfetch] Failed. Serving cached offline fallback ' +
          error
        );
        return caches.open('offline').then(function(cache) {
          return cache.match('offline.html');
        });
      })
    );
  }
  // Any other handlers come here. Without calls to `event.respondWith()` the
  // request will be handled without the ServiceWorker.
});

self.addEventListener("message", function(event) {
  mainCode = event.source
  if (event.data === "Initial message to service worker.") {
    event.source.postMessage("Initial message to main code.");
  }
});

self.addEventListener('notificationclick', function(event) {
  if (!event.action) {
    event.notification.close();
    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    }));
    return;
  }

  switch (event.action) {
    case 'reply':
      mainCode.postMessage("Notification Quick Reply: " + event.reply)
      event.notification.close();
      break;
    case 'close':
      console.log('Close');
      event.notification.close();
      break;
    default:
      event.notification.close();
      console.log(`Unknown action clicked: '${event.action}'`);
      break;
  }
});
