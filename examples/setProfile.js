const Vallox = require('../');

(async () => {
  const client = new Vallox({ ip: '192.168.178.33', port: 80 })
  await client.setProfile(client.PROFILES.AWAY)
})()
