'use strict'

import { KV } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { range } from 'lodash'
import P from 'bluebird'
import Logger from 'bellman'
import assert from 'power-assert'

import storeKV from '../src-build/store/storeKV'
import restoreKV from '../src-build/restore/restoreKV'

let logger = new Logger()
let restorePath = resolve(__dirname, '../test-highload-local/restore-load')
if (existsSync(restorePath)) unlinkSync(restorePath)

console.time('mapped!')

let kv = new KV()
range(0, 1e7)
  .map(el => ({ el }))
  .forEach((k, v) => kv.add(k, v))

console.timeEnd('mapped!')
console.info('kv size:', kv.size())
console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)

P.resolve()
  .then(() => P.resolve()
    .tap(() => console.time('stored!'))
    .then(() => storeKV(kv, 'some-name', restorePath))
    .tap(() => console.timeEnd('stored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(() => P.resolve()
    .tap(() => console.time('restored!'))
    .then(() => restoreKV('some-name', restorePath))
    .tap(() => console.timeEnd('restored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(it => P.resolve(it)
    .tap(() => console.time('compared!'))
    .then(it => assert.deepStrictEqual(it, kv))
    .tap(() => console.timeEnd('compared!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .catch(err => logger.error(err))
