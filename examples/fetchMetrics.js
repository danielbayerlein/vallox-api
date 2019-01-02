const Vallox = require('../');

(async () => {
  const client = new Vallox({ ip: '192.168.178.33', port: 80 })
  const result = await client.fetchMetrics([
    'A_CYC_TEMP_EXTRACT_AIR',
    'A_CYC_TEMP_EXHAUST_AIR'
  ])
  console.log(result)
})()
