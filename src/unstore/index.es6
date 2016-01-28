'use strict'

import nodeGlob from 'glob'
import { existsSync as exists,
  unlink as nodeUnlink } from 'fs'
import P, { promisify } from 'bluebird'

let glob = promisify(nodeGlob)
let unlink = promisify(nodeUnlink)

export default function unstore(restorePath) {
  let patterns = [ restorePath, `${restorePath}.@(KV|Queue|HashVault).*` ]
  return P.resolve()
    .then(() => exists(restorePath))
    .then(ex => ex
      ? P.resolve()
      : P.reject(`unstore problem: restorePath not exist - ${restorePath}`))
    .return(patterns)
    .map(p => glob(p, { dot: true }))
    .reduce((acc, part) => acc.concat(part), [])
    .each(f => unlink(f))
}
