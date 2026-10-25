import { clientsClaim } from 'workbox-core'
import { addPlugins, cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { RangeRequestsPlugin } from 'workbox-range-requests'

// Cache the interface at installation and downloaded songs on demand. Safari's media element
// can then request byte ranges without needing a network connection.
addPlugins([new RangeRequestsPlugin()])
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(({url,request})=>url.origin===self.location.origin&&(url.pathname.startsWith('/music/catalog/')||url.pathname.startsWith('/music/artwork/'))&&request.method==='GET',new CacheFirst({cacheName:'promotiles-music-v1',plugins:[new CacheableResponsePlugin({statuses:[200]}),{cacheWillUpdate:async({response})=>response.redirected||response.headers.get('Content-Type')?.includes('text/html')?null:response},new ExpirationPlugin({maxEntries:260,maxAgeSeconds:60*60*24*30}),new RangeRequestsPlugin()]}))
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'),{denylist:[/^\/api\//,/^\/cdn-cgi\//]}))
clientsClaim()

// Keep the existing explicit update prompt; never replace an active game.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
