const WebSocket = require('ws')
const { VlxDevConstants } = require('./lib/constants')
const { VlxDataBuffer, VlxWriteItem, calculateOffset } = require('./lib/vallox')

module.exports = class Vallox {
  constructor (config) {
    this._config = config
    this._kelvinToZero = 273.15

    this.PROFILES = {
      NONE: 0,
      HOME: 1,
      AWAY: 2,
      BOOST: 3,
      FIREPLACE: 4,
      EXTRA: 5
    }
  }

  async _request (data) {
    const { ip, port } = this._config

    const ws = new WebSocket(`ws://${ip}:${port}/`)
    ws.binaryType = 'arraybuffer'

    return new Promise((resolve, reject) => {
      ws.onopen = () => ws.send(data)

      ws.onmessage = event => {
        ws.close()
        resolve(event.data)
      }

      ws.onerror = error => reject(error)
    })
  }

  _toCelsius (aKelvins) {
    const celsius = (aKelvins / 100) - this._kelvinToZero
    return Math.round(celsius)
  }

  _toKelvin (aCelcius) {
    const kelvin = (parseInt(aCelcius) + this._kelvinToZero) * 100
    return Math.round(kelvin)
  }

  _convert (key, value, cb) {
    return key.indexOf('_TEMP_') === -1 || key.indexOf('_MODE') > 0
      ? value
      : cb()
  }

  async getProfile () {
    const result = await this.fetchMetrics([
      'A_CYC_STATE',
      'A_CYC_BOOST_TIMER',
      'A_CYC_FIREPLACE_TIMER',
      'A_CYC_EXTRA_TIMER'
    ])

    if (result['A_CYC_BOOST_TIMER'] > 0) return this.PROFILES.BOOST
    if (result['A_CYC_FIREPLACE_TIMER'] > 0) return this.PROFILES.FIREPLACE
    if (result['A_CYC_EXTRA_TIMER'] > 0) return this.PROFILES.EXTRA
    if (result['A_CYC_STATE'] === 1) return this.PROFILES.AWAY
    if (result['A_CYC_STATE'] === 0) return this.PROFILES.HOME

    return this.PROFILES.NONE
  }

  async setProfile (profile, duration) {
    const metrics = await this.fetchMetrics()

    switch (profile) {
      case this.PROFILES.HOME:
        this.setValues({
          'A_CYC_STATE': 0,
          'A_CYC_BOOST_TIMER': 0,
          'A_CYC_FIREPLACE_TIMER': 0,
          'A_CYC_EXTRA_TIMER': 0
        })
        break

      case this.PROFILES.AWAY:
        this.setValues({
          'A_CYC_STATE': 1,
          'A_CYC_BOOST_TIMER': 0,
          'A_CYC_FIREPLACE_TIMER': 0,
          'A_CYC_EXTRA_TIMER': 0
        })
        break

      case this.PROFILES.FIREPLACE:
        this.setValues({
          'A_CYC_BOOST_TIMER': 0,
          'A_CYC_FIREPLACE_TIMER': duration || metrics.A_CYC_FIREPLACE_TIME,
          'A_CYC_EXTRA_TIMER': 0
        })
        break

      case this.PROFILES.BOOST:
        this.setValues({
          'A_CYC_BOOST_TIMER': duration || metrics.A_CYC_BOOST_TIME,
          'A_CYC_FIREPLACE_TIMER': 0,
          'A_CYC_EXTRA_TIMER': 0
        })
        break

      case this.PROFILES.EXTRA:
        this.setValues({
          'A_CYC_BOOST_TIMER': 0,
          'A_CYC_FIREPLACE_TIMER': 0,
          'A_CYC_EXTRA_TIMER': duration || metrics.A_CYC_EXTRA_TIME
        })
        break

      default:
        throw new TypeError(`"${profile}" is not a valid profile.`)
    }
  }

  async fetchMetric (key) {
    if (Object.keys(VlxDevConstants).indexOf(key) === -1) {
      throw new TypeError(`"${key}" is not a valid key.`)
    }

    const metrics = await this.fetchMetrics([key])
    return metrics[key]
  }

  async fetchMetrics (keys = Object.keys(VlxDevConstants)) {
    const addy = VlxDevConstants.WS_WEB_UI_COMMAND_READ_TABLES

    const item = new VlxWriteItem()
    item.address = addy

    const buf = new VlxDataBuffer()
    buf.appendData(item)

    const data = await this._request(buf.convertDataToBuffer(addy))

    const buffysize = data.byteLength / 2
    const vlxBufferSize = 705
    const vlxReceiveBuffer = new Uint16Array(vlxBufferSize)
    const dv = new DataView(data)

    for (let i = 0, off = 0; i < buffysize; i++, off += 2) {
      vlxReceiveBuffer[i] = dv.getUint16(off, false)
    }

    const result = {}

    keys.forEach(key => {
      const value = vlxReceiveBuffer[calculateOffset(VlxDevConstants[key])]
      result[key] = this._convert(key, value, () => this._toCelsius(value))
    })

    return result
  }

  async setValues (obj) {
    const buf = new VlxDataBuffer()

    Object.keys(obj).forEach(key => {
      const value = obj[key]
      const item = new VlxWriteItem()

      item.address = VlxDevConstants[key]
      item.value = this._convert(key, value, () => this._toKelvin(value))
      buf.appendData(item)
    })

    await this._request(buf.convertDataToBuffer(VlxDevConstants.WS_WEB_UI_COMMAND_WRITE_DATA))

    return true
  }
}
