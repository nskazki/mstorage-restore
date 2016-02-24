'use strict'

import { store, exists, restore, cp } from '../src'
import { KV, Queue, HashVault } from 'mstorage'
import { tmpNameSync } from 'tmp'
import { dirname, resolve } from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import { sync as glob } from 'glob'
import { unlinkSync as unlink } from 'fs'
import { range, concat, toPlainObject } from 'lodash'
import P from 'bluebird'
import assert from 'power-assert'

let template = resolve(__dirname, '../test-cp-local/restore-XXXXXX')
let restoreDir = dirname(template)
let restoreGlob = `${restoreDir}/*`

mkdirpSync(restoreDir)
glob(restoreGlob, { dot: true }).forEach(unlink)

describe('cp', () => {
  it('mixed storages - copyed', () => {
    let oldRestorePath = tmpNameSync({ template })
    let newRestorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, oldRestorePath))
      .then(() => cp(oldRestorePath, newRestorePath))
      .then(() => P.join(
        exists(oldRestorePath).then(exist => assert.ok(exist),
        exists(newRestorePath).then(exist => assert.ok(exist)))))
      .then(() => restore(newRestorePath))
      .then(it => assert.deepStrictEqual(it, arr))
  })

  it('mixed storages - not copyed', () => {
    let oldRestorePath = tmpNameSync({ template })
    let newRestorePath = '/dev/null/oh'
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, oldRestorePath))
      .then(() => cp(oldRestorePath, newRestorePath))
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
