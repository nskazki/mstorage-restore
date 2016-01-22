'use strict'

import { Queue } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { range } from 'lodash'
import P from 'bluebird'
import Logger from 'bellman'
import assert from 'power-assert'

import storeQueue from '../src-build/store/storeQueue'
import restoreQueue from '../src-build/restore/restoreQueue'

let logger = new Logger()
let restorePath = resolve(__dirname, '../test-highload-local/restore-load')
if (existsSync(restorePath)) unlinkSync(restorePath)

console.time('mapped!')

let queue = new Queue()
range(0, 1e7)
  .map(el => ({ el }))
  .forEach(el => queue.add(el))

console.timeEnd('mapped!')
console.info('queue size:', queue.size())
console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)

P.resolve()
  .then(() => P.resolve()
    .tap(() => console.time('stored!'))
    .then(() => storeQueue(queue, 'some-name', restorePath))
    .tap(() => console.timeEnd('stored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(() => P.resolve()
    .tap(() => console.time('restored!'))
    .then(() => restoreQueue('some-name', restorePath))
    .tap(() => console.timeEnd('restored!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .then(it => P.resolve(it)
    .tap(() => console.time('compared!'))
    .then(it => assert.deepStrictEqual(it, queue))
    .tap(() => console.timeEnd('compared!'))
    .tap(() => console.info('memory [MB]:', process.memoryUsage().heapUsed/1024/1024)))
  .catch(err => logger.error(err))
