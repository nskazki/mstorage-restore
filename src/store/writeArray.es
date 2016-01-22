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
      let num = array[index]
      chunkBuff = chunkBuff + fmt(num) + '\n'
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
