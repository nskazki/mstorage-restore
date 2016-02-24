'use strict'

import { existsSync } from 'fs'
import { readFileSync as readJsonSync,
  writeFileSync as writeJsonSync } from 'jsonfile'
import { isArray, isObject,
  isString, merge, snakeCase } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'
import writeArray from './writeArray'

let debug = new Debug('libs-mstorage-restore:storeQueue')
let obj2str = JSON.stringify

export default function storeQueue(queue, queueName, restorePath) {
  return P.try(() => {
    if (!isArray(queue._storage) && !isArray(queue._queue))
      return P.reject(new Error(`storeQueue Problem: first arg must be a Queue!`))

    let restorePlanBase = existsSync(restorePath)
      ? readJsonSync(restorePath)
      : []

    let restoreVaultPath = `${restorePath}.Queue.${snakeCase(queueName)}`
    let restorePlanSumm = restorePlanBase.concat({
      restoreVaultType: 'Queue',
      restoreVaultName: queueName,
      restoreVaultPath
    })

    writeJsonSync(restorePath, restorePlanSumm, { spaces: 2 })

    let restoreVaultPlan = buildVaultPlan(queue, queueName, restoreVaultPath)
    writeJsonSync(restoreVaultPath, restoreVaultPlan, { spaces: 2 })

    debug(`queue: ${queueName}`)
    debug(`  restoreVaultPath: ${restoreVaultPath}`)
    debug(`  q.restoreKeyPath: ${restoreVaultPlan._queue.restoreKeyPath}`)
    debug(`  s.restoreKeyPath: ${restoreVaultPlan._storage.restoreKeyPath}`)

    return P.join(
      writeArray(queue._queue, restoreVaultPlan._queue.restoreKeyPath),
      writeArray(queue._storage, restoreVaultPlan._storage.restoreKeyPath, obj2str))
  }).catch(err => {
    let message = `storeQueue problem!'\
      \n\t queueSize: ${queue.size()}\
      \n\t queueName: ${queueName}\
      \n\t restorePath: ${restorePath}\
      \n\t originalErr: ${err.message || obj2str(err)}`
    return isObject(err) && isString(err.message)
      ? P.reject(merge(err, { message }))
      : P.reject(new Error(message))
  })
}

function buildVaultPlan(queue, queueName, restoreVaultPath) {
  return {
    restoreVaultType: 'Queue',
    restoreVaultName: queueName,
    restoreVaultPath,

    _storage: {
      dumpLength: queue._storage.length,
      restoreKeyPath: `${restoreVaultPath}._storage`,
      restoreKeyName: '_storage'
    },
    _queue: {
      dumpLength: queue._queue.length,
      restoreKeyPath: `${restoreVaultPath}._queue`,
      restoreKeyName: '_queue'
    }
  }
}
