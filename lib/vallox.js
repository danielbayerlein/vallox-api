const { VlxDevConstants, vlxOffsetObject } = require('./constants')

const calculateOffset = (aIndex) => {
  let offset = 0

  if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_general_info) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_general_info)) {
    offset = aIndex + 1
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_typhoon_general_info) && (aIndex <= VlxDevConstants.RANGE_END_g_typhoon_general_info)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_typhoon_general_info + vlxOffsetObject.CYC_NUM_OF_GENERAL_INFO
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_hw_state) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_hw_state)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_hw_state + vlxOffsetObject.CYC_NUM_OF_GENERAL_TYP_INFO
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_sw_state) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_sw_state)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_sw_state + vlxOffsetObject.CYC_NUM_OF_HW_STATES
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_time) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_time)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_time + vlxOffsetObject.CYC_NUM_OF_SW_STATES
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_output) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_output)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_output + vlxOffsetObject.CYC_NUM_OF_TIME_ELEMENTS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_input) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_input)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_input + vlxOffsetObject.CYC_NUM_OF_OUTPUTS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_config) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_config)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_config + vlxOffsetObject.CYC_NUM_OF_INPUTS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_settings) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_settings)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_settings + vlxOffsetObject.CYC_NUM_OF_CONFIGS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_typhoon_settings) && (aIndex <= VlxDevConstants.RANGE_END_g_typhoon_settings)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_typhoon_settings + vlxOffsetObject.CYC_NUM_OF_CYC_SETTINGS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_self_test) && (aIndex <= VlxDevConstants.RANGE_END_g_self_test)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_self_test + vlxOffsetObject.CYC_NUM_OF_TYP_SETTINGS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_faults) && (aIndex <= VlxDevConstants.RANGE_END_g_faults)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_faults + vlxOffsetObject.CYC_NUM_OF_SELF_TESTS
  } else if ((aIndex > VlxDevConstants.RANGE_START_g_cyclone_weekly_schedule) && (aIndex <= VlxDevConstants.RANGE_END_g_cyclone_weekly_schedule)) {
    offset = (aIndex) - VlxDevConstants.RANGE_START_g_cyclone_weekly_schedule + vlxOffsetObject.CYC_NUM_OF_FAULTS
  }

  return offset - 1
}

class VlxWriteItem {
  constructor () {
    this.type = 0 // 0 = normal item , 1=week clock item
    this.address = 0
    this.value = 0
    this.extraParameter = 0
  }
}

class VlxDataBuffer {
  constructor () {
    this.data = []
  }

  appendData (aDataItem) {
    this.data.push(aDataItem)
  }

  clear () {
    this.data.splice(0, this.data.length)
  }

  convertDataToBuffer (aRequestType) {
    if (aRequestType === undefined) {
      console.log('Request type not defined, assuming write')
      aRequestType = VlxDevConstants.WS_WEB_UI_COMMAND_WRITE_DATA
    }

    const mandatoryParamCount = 3 // len, command, chksum
    let bufferLength = this.data.length // input params
    let commandWords = 3

    if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_WRITE_DATA) {
      commandWords = 2
    } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_READ_TABLES) {
      commandWords = 1
    } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_READ_DATA) {
      commandWords = 1
    } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_LOG_RAW) {
      commandWords = 0
    }

    bufferLength = this.data.length * commandWords + mandatoryParamCount

    if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_LOG_LIMITED) {
      bufferLength -= 1
    }

    const buffer = new Uint16Array(bufferLength)
    let index = 0

    // buffer length in the start of buffer
    buffer[index] = bufferLength - 1
    index++

    if (aRequestType !== VlxDevConstants.WS_WEB_UI_COMMAND_LOG_LIMITED) {
      buffer[index] = aRequestType
      index++
    }

    for (let i = 0; i < this.data.length; i++) {
      // write only read command/empty values in case of read table
      if ((aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_READ_DATA)) {
        buffer[index + i] = this.data[i].address
      } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_READ_TABLES) {
        buffer[index + i] = this.data[i].value
      } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_WRITE_DATA) {
        buffer[index + i * 2] = this.data[i].address
        buffer[index + i * 2 + 1] = this.data[i].value
      } else if (aRequestType === VlxDevConstants.WS_WEB_UI_COMMAND_LOG_RAW) {
        buffer[index + i * 2] = this.data[i].address
      } else { // partial log data request has three params
        buffer[index + i * 2] = this.data[i].address
        buffer[index + i * 2 + 1] = this.data[i].value

        if (this.data[i].address === VlxDevConstants.WS_WEB_UI_COMMAND_LOG_LIMITED) {
          buffer[index + i * 2 + 2] = this.data[i].extraParameter
        }
      }
    }

    // calculate checksum
    let checksum = 0
    for (let i = 0; i < bufferLength - 1; i++) {
      checksum = checksum + buffer[i]
    }
    checksum = checksum & 0xffff
    buffer[bufferLength - 1] = checksum

    return buffer
  }
}

module.exports = {
  calculateOffset,
  VlxWriteItem,
  VlxDataBuffer
}
