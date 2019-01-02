const Vallox = require('../');

(async () => {
  const client = new Vallox({ ip: '192.168.178.33', port: 80 })
  const result = await client.fetchMetric('A_CYC_TEMP_OUTDOOR_AIR')
  console.log(`Outside air temperature: ${result}°C`)
})()
