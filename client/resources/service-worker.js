self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting()); // Activate service worker immediately
  event.waitUntil((async () => {
    // Make sure we're online before attemping to add the offline page to the cache
    if (navigator.onLine) {
      const cache = await caches.open('HyperChat-Cache');
      // Setting {cache: 'reload'} in the new request will ensure that the response
      // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
      // Here we add the offline page to the cache for usage offline
      await cache.add(new Request('/resources/offline/offline.html', {cache: 'reload'}));
    }
  })());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

// Stale-while-revalidate service worker caching method
self.addEventListener('fetch', (event) => {
  // Opening devtools will trigger these o-i-c requests, which the service worker can't handle, so return
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
  // If the request method isn't GET, let the browser handle it
  if (event.request.method !== 'GET') return;
  // Make a new URL from the request URL
  const reqURL = new URL(event.request.url);
  // Let the browser handle it if it isn't a normal http/https request
  if (!reqURL.protocol.startsWith('http') || reqURL.pathname == '/socket.io/') return;
  // If we are offline, serve the offline page
  if (!navigator.onLine) {
    event.respondWith(async function() {
      const cache = await caches.open('HyperChat-Cache');
      const offlineResponse = await cache.match('/resources/offline/offline.html');
      return offlineResponse;
    }());
    return;
  }
  event.respondWith(async function() {
    const cache = await caches.open('HyperChat-Cache');
    const cachedResponse = await cache.match(event.request);
    const networkResponsePromise = fetch(event.request);

    event.waitUntil(async function() {
      await networkResponsePromise.then(async function(networkResponse) {
        await cache.put(event.request, networkResponse.clone());
      }).catch(function(error) {
        console.error(`Error fetching resource ${event.request.url} due to error: ${error}`)
      });
    }());

    // Returned the cached response if we have one, otherwise return the network response.
    return cachedResponse || networkResponsePromise;
  }());
});

self.addEventListener('message', function(event) {
  self.mainCode = event.source;
  if (event.data === 'Initial message to service worker.') {
    event.source.postMessage('Initial message to main code.');
  }
});

self.addEventListener('notificationclick', function(event) {
  if (!event.action) {
    event.notification.close();
    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(self.clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    }));
    return;
  }

  switch (event.action) {
    case 'reply':
      self.mainCode.postMessage(`Notification Quick Reply: ${event.reply}`);
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
