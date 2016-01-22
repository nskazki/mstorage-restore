'use strict'

import { HashVault } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { range } from 'lodash'
import P from 'bluebird'
import Logger from 'bellman'
import assert from 'power-assert'

import storeHashVault from '../src-build/store/storeHashVault'
import restoreHashVault from '../src-build/restore/restoreHashVault'

let logger = new Logger()
let restorePath = resolve(__dirname, '../test-highload-local/restore-load')
if (existsSync(restorePath)) unlinkSync(restorePath)

console.time('mapped!')

let hashVault = new HashVault()
let arr = range(0, 1e7).map(el => ({ el }))
hashVault.init(arr)

console.timeEnd('mapped!')
console.info('hashVault size:', hashVault.size())
console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)

P.resolve()
  .then(() => P.resolve()
    .tap(() => console.time('stored!'))
    .then(() => storeHashVault(hashVault, 'some-name', restorePath))
    .tap(() => console.timeEnd('stored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(() => P.resolve()
    .tap(() => console.time('restored!'))
    .then(() => restoreHashVault('some-name', restorePath))
    .tap(() => console.timeEnd('restored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(it => P.resolve(it)
    .tap(() => console.time('compared!'))
    .then(it => assert.deepStrictEqual(it, hashVault))
    .tap(() => console.timeEnd('compared!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .catch(err => logger.error(err))
