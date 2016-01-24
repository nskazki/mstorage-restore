'use strict'

import { createReadStream } from 'fs'
import P from 'bluebird'
import split from 'split'
import e2p from 'simple-e2p'

export default function readArray(restoreKeyPath, fmt = v => v) {
  let summ = []
  let readf = createReadStream(restoreKeyPath, { encoding: 'utf8' })
  let parse = readf
    .pipe(split())
    .on('data', line => {
      if (/^\s*$/.test(line)) return
      if (line === 'undefined') {
        summ.push(undefined)
        delete summ[summ.length - 1]
      } else {
        summ.push(fmt(line))
      }
    })

  return P.join(
    e2p(readf, 'end', 'error'),
    e2p(parse, 'end', 'error')
  ).return(summ)
}
