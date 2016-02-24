'use strict'

import { store, exists, unstoreStrict } from '../src'
import { KV, Queue, HashVault } from 'mstorage'
import { tmpNameSync } from 'tmp'
import { dirname, resolve } from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import { sync as glob } from 'glob'
import { unlinkSync as unlink } from 'fs'
import { range, concat, toPlainObject } from 'lodash'
import P from 'bluebird'
import assert from 'power-assert'

let template = resolve(__dirname, '../test-unstore-strict-local/restore-XXXXXX')
let restoreDir = dirname(template)
let restoreGlob = `${restoreDir}/*`

mkdirpSync(restoreDir)
glob(restoreGlob, { dot: true }).forEach(unlink)

describe('cp', () => {
  it('mixed storages - unstored', () => {
    let oldRestorePath = tmpNameSync({ template })
    let newRestorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, oldRestorePath))
      .then(() => unstoreStrict(oldRestorePath, newRestorePath))
      .then(() => exists(oldRestorePath).then(exist => assert.ok(!exist)))
  })

  it('/dev/null - not unstored', () => {
    let oldRestorePath = '/dev/null/oh'

    return P.resolve()
      .then(() => unstoreStrict(oldRestorePath))
      .then(
        () => P.reject(new Error(`copyed, but it's impossible!`)),
        () => P.resolve())
  })
})

function genStorages() {
  let kvs = range(2).map(() => new KV())
  let qes = range(2).map(() => new Queue())
  let hvs = range(2).map(() => new HashVault())
  let arr = concat(kvs, qes, hvs)
  return toPlainObject(arr)
}
