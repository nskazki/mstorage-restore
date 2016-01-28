'use strict'

import { Queue } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { inspect as inspectSimple } from 'util'
import { forEach, isObject } from 'lodash'
import Logger from 'bellman'
import assert from 'power-assert'

import storeQueue from '../src/store/storeQueue'
import restoreQueue from '../src/restore/restoreQueue'

let logger = new Logger()
let inspect = v => inspectSimple(v, { colors: true, depth: null })
let restorePath = resolve(__dirname, '../test-inspecth-local/restore-load')
let queue = new Queue()

queue.add({ 0: 0 })
queue.add({ 1: 1 })
queue.add({ 2: 2 })
queue.add({ 3: 3 })

queue.del(2)
queue.toHead(3)
queue.toTail(0)

console.info('Queue:', inspect(queue))
console.info()

if (existsSync(restorePath)) unlinkSync(restorePath)
storeQueue(queue, 'some-name', restorePath)
  .then(() => console.info('stored!'))
  .then(() => inspectRestoreFiles(restorePath))
  .then(() => restoreQueue('some-name', restorePath))
  .tap(() => console.info('Queue:', inspect(queue)))
  .tap(it => assert.deepStrictEqual(it, queue))
  .catch(err => logger.error(err))

function inspectRestoreFiles(restorePath) {
  let restorePlan = readJsonSync(restorePath)
  console.info('restorePlan:', inspect(restorePlan))
  console.info()

  restorePlan.forEach(restorePlanChunk => {
    console.info('restorePlanChunk:', inspect(restorePlanChunk))
    console.info()

    let restoreVaultPath = restorePlanChunk.restoreVaultPath
    let restoreVaultPlan = readJsonSync(restoreVaultPath)
    console.info('restoreVaultPlan:', inspect(restoreVaultPlan))
    console.info()

    forEach(restoreVaultPlan, restoreKeyPlan => {
      if (!isObject(restoreKeyPlan)) return
      console.info('restoreKeyPlan:', inspect(restoreKeyPlan))
      console.info()

      let restoreKeyDump = readFileSync(restoreKeyPlan.restoreKeyPath, { encoding: 'utf8' })
      console.info('restoreKeyDump:\n%s', restoreKeyDump)
    })
  })
}
