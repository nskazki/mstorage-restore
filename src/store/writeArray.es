'use strict'

import { appendFileSync, existsSync } from 'fs'
import P from 'bluebird'

export default function writeArray(array, restoreKeyPath, fmt = v => v) {
  return P.try(() => {
    if (existsSync(restoreKeyPath))
      return P.reject(new Error(`writeArray problem - file already exist: ${restoreKeyPath}`))

    let chunkSize = 1000
    let chunkCurr = 0
    let chunkBuff = ''
    for (let index = 0; index !== array.length; index++) {
      let val = array[index]
      chunkBuff = chunkBuff + str(array, val, index, fmt) + '\n'
      chunkCurr++
      if (chunkCurr === chunkSize) {
        appendFileSync(restoreKeyPath, chunkBuff)
        chunkBuff = ''
        chunkCurr = 0
      }
    }

    appendFileSync(restoreKeyPath, chunkBuff)
  })
}

function str(array, val, index, fmt) {
  if (typeof val === 'number') {
    if (isFinite(val)) return fmt(val)
    else if (val !== val) return '__NaN__'
    else return '__infinity__'
  } else if (val === null) {
    return '__null__'
  } else if (val === undefined) {
    return array.hasOwnProperty(index)
      ? '__undefined__'
      : '__delete__'
  } else {
    return fmt(val)
  }
}
