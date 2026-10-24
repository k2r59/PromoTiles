import { clientsClaim } from 'workbox-core'
import { addPlugins, cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { RangeRequestsPlugin } from 'workbox-range-requests'

// Cache the complete provided track during installation. Safari's media element
// can then request byte ranges without needing a network connection.
addPlugins([new RangeRequestsPlugin()])
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
clientsClaim()

// Keep the existing explicit update prompt; never replace an active game.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
