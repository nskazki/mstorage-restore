'use strict'

import { store, exists, unstore } from '../src'
import { KV, Queue, HashVault } from 'mstorage'
import { tmpNameSync } from 'tmp'
import { dirname, resolve } from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import { sync as glob } from 'glob'
import { unlinkSync as unlink } from 'fs'
import { range, concat, toPlainObject } from 'lodash'
import P from 'bluebird'
import assert from 'power-assert'

let template = resolve(__dirname, '../test-exists-local/restore-XXXXXX')
let restoreDir = dirname(template)
let restoreGlob = `${restoreDir}/*`

mkdirpSync(restoreDir)
glob(restoreGlob, { dot: true }).forEach(unlink)

describe('Exists', () => {
  it('mixed storages - exist', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => exists(restorePath).then(exist => assert.ok(exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink restorePath)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => unlink(restorePath))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => glob(restoreGlob, { dot: true }).forEach(unlink))
  })

  it('mixed storages - not exist (unlink all Queue)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*Queue*`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all KV)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*KV*`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all HashVault)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*HashVault*`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all _array)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*_array`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all _keys)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*_keys`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all _values)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*_values`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all _queue)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*_queue`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })

  it('mixed storages - not exist (unlink all _storage)', () => {
    let restorePath = tmpNameSync({ template })
    let arr = genStorages()

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => glob(`${restoreDir}/*_storage`).forEach(unlink))
      .then(() => exists(restorePath).then(exist => assert.ok(!exist)))
      .then(() => unstore(restorePath))
  })
})

function genStorages() {
  let kvs = range(10).map(() => new KV())
  let qes = range(10).map(() => new Queue())
  let hvs = range(10).map(() => new HashVault())
  let arr = concat(kvs, qes, hvs)
  return toPlainObject(arr)
}
