'use strict'

import { HashVault } from 'mstorage'
import { existsSync, unlinkSync } from 'fs'
import { sync as mkdirpSync } from 'mkdirp'
import { tmpNameSync } from 'tmp'
import { range, merge } from 'lodash'
import { dirname, resolve } from 'path'
import { } from 'console.table'
import P from 'bluebird'
import Logger from 'bellman'
import pretty from 'pretty-ms'
import assert from 'power-assert'

import storeHashVault from '../src-build/store/storeHashVault'
import restoreHashVault from '../src-build/restore/restoreHashVault'

let logger = new Logger()
let plan = [ 1e3, 1e4, 1e5, 1e6, 1e7 ]
let nums = false
let objs = true

P.resolve(plan)
  .mapSeries(size => P
    .join(
      test(size, nums).then(res => merge({ size, objs: ' ', nums: 'x' }, res)),
      test(size, objs).then(res => merge({ size, objs: 'x', nums: ' ' }, res)))
    .tap(() => console.error(`done - ${size}`)))
  .reduce((acc, part) => acc.concat(part), [])
  .then(table => {
    console.info('HashVault:')
    console.table(table)
  })
  .catch(err => logger.error(err))

function test(size, mapNums = false) {
  let template = resolve(__dirname, '../test-highload-local/restore-XXXXXX')
  mkdirpSync(dirname(template))
  let restorePath = tmpNameSync({ template })

  let mapping, storing, restoring, comparing
  let res = { mapped: null, stored: null, restored: null, compared: null }

  mapping = Date.now()
  let hashVault = new HashVault()
  let arr = range(0, size).map(el => mapNums ? { el } : el)
  hashVault.init(arr)
  res.mapped = pretty(Date.now() - mapping)

  return P.resolve()
    .then(() => P.resolve()
      .tap(() => storing = Date.now())
      .then(() => storeHashVault(hashVault, 'some-name', restorePath))
      .tap(() => res.stored = pretty(Date.now() - storing)))
    .then(() => P.resolve()
      .tap(() => restoring = Date.now())
      .then(() => restoreHashVault('some-name', restorePath))
      .tap(() => res.restored = pretty(Date.now() - restoring)))
    .then(it => P.resolve(it)
      .tap(() => comparing = Date.now())
      .then(it => assert.deepStrictEqual(it, hashVault))
      .tap(() => res.compared = pretty(Date.now() - comparing)))
    .return(res)
}
