'use strict'

import { store, unstore } from '../src'
import { KV, Queue, HashVault } from 'mstorage'
import { tmpNameSync } from 'tmp'
import { dirname, resolve } from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import { sync as glob } from 'glob'
import { unlinkSync as unlink } from 'fs'
import { range, concat, toPlainObject } from 'lodash'
import P from 'bluebird'
import assert from 'power-assert'

let template = resolve(__dirname, '../test-unstorage-local/restore-XXXXXX')
let restoreDir = dirname(template)
let restoreGlob = `${restoreDir}/*`

mkdirpSync(restoreDir)
glob(restoreGlob, { dot: true }).forEach(unlink)

describe('Unlink', () => {
  it('one KV storage', () => {
    let restorePath = tmpNameSync({ template })
    let foo = new KV()
    foo.add(0, 'a')

    return P.resolve()
      .then(() => store({ foo }, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('one Queue storage', () => {
    let restorePath = tmpNameSync({ template })
    let foo = new Queue()
    foo.add(0)

    return P.resolve()
      .then(() => store({ foo }, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('one HashVault storage', () => {
    let restorePath = tmpNameSync({ template })
    let foo = new HashVault()
    foo.add(0)

    return P.resolve()
      .then(() => store({ foo }, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('few KV storages', () => {
    let restorePath = tmpNameSync({ template })
    let arr = toPlainObject(range(10).map(() => new KV()))

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('few Queue storages', () => {
    let restorePath = tmpNameSync({ template })
    let arr = toPlainObject(range(10).map(() => new Queue()))

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('few HashVault storages', () => {
    let restorePath = tmpNameSync({ template })
    let arr = toPlainObject(range(10).map(() => new HashVault()))

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })

  it('mixed storages', () => {
    let restorePath = tmpNameSync({ template })
    let kvs = range(10).map(() => new KV())
    let qes = range(10).map(() => new Queue())
    let hvs = range(10).map(() => new HashVault())
    let arr = toPlainObject(concat(kvs, qes, hvs))

    return P.resolve()
      .then(() => store(arr, restorePath))
      .then(() => unstore(restorePath))
      .then(() => glob(restoreGlob))
      .then(it => assert(it.length === 0))
  })
})
