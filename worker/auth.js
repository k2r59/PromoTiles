import { createRemoteJWKSet, jwtVerify } from 'jose'
const keySets = new Map()
export const fail = (status, message) => Object.assign(new Error(message), { status })
export function normalizeEmail(value, domain = 'promo.dev') {
 if (typeof value !== 'string') throw fail(403, 'Une adresse @promo.dev vérifiée est obligatoire.')
 const email = value.trim().toLowerCase()
 if (email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email) || email.split('@')[1] !== domain) throw fail(403, 'Cet espace est réservé aux adresses @promo.dev.')
 return email
}
export function validateIdentity(payload, domain) {
 if (typeof payload.sub !== 'string' || !payload.sub) throw fail(401, 'Reconnectez-vous à votre espace.')
 return { email: normalizeEmail(payload.email, domain), subject: payload.sub }
}
export async function verifyAccess(request, env) {
 if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw fail(503, 'La connexion privée de l’équipe est en cours de configuration.')
 if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN)) throw fail(503, 'Configuration de connexion indisponible.')
 const token = request.headers.get('Cf-Access-Jwt-Assertion') || request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('CF_Authorization='))?.slice(17)
 if (!token) throw fail(401, 'Connectez-vous avec votre adresse @promo.dev.')
 const issuer = 'https://' + env.ACCESS_TEAM_DOMAIN
 let jwks = keySets.get(issuer)
 if (!jwks) { jwks = createRemoteJWKSet(new URL(issuer + '/cdn-cgi/access/certs')); keySets.set(issuer, jwks) }
 return verifyAccessToken(token,env,jwks)
}
export async function verifyAccessToken(token,env,jwks) {
 const issuer='https://'+env.ACCESS_TEAM_DOMAIN
 try {
  const { payload } = await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp','sub','email'] })
  return validateIdentity(payload, env.ALLOWED_EMAIL_DOMAIN || 'promo.dev')
 } catch (error) { if (error.status) throw error; throw fail(401, 'Votre connexion a expiré. Reconnectez-vous.') }
}
