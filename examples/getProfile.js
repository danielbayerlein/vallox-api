const Vallox = require('../');

(async () => {
  const client = new Vallox({ ip: '192.168.178.33', port: 80 })
  const profiles = client.PROFILES
  const result = await client.getProfile()
  console.log('Current profile:', Object.keys(profiles).find(key => profiles[key] === result))
})()
