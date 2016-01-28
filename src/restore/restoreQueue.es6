'use strict'

import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { Queue } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import readArray from './readArray'

let debug = new Debug('libs-mstorage-restore:restoreQueue')
let obj2str = JSON.stringify
let str2obj = JSON.parse

export default function restoreQueue(queueName, restorePath) {
  let restorePlan = readJsonSync(restorePath)

  let restoreVaultPath = chain(restorePlan)
    .filter(({ restoreVaultType }) => restoreVaultType === 'Queue')
    .filter(({ restoreVaultName }) => restoreVaultName === queueName)
    .first().get('restoreVaultPath').value()

  if (!isString(restoreVaultPath))
    return P.reject(new Error(`restoreQueue problem: restoreVaultPath not found!\
      \n\t queueName: ${queueName}\
      \n\t restorePath: ${restorePath}`))

  let restoreVaultPlan = readJsonSync(restoreVaultPath)

  debug(`queue: ${queueName}`)
  debug(`  restoreVaultPath: ${restoreVaultPath}`)
  debug(`  q.restoreKeyPath: ${restoreVaultPlan._queue.restoreKeyPath}`)
  debug(`  s.restoreKeyPath: ${restoreVaultPlan._storage.restoreKeyPath}`)

  let queue = new Queue()
  let _storage = P.resolve()
    .then(() => readArray(restoreVaultPlan._storage.restoreKeyPath, str2obj))
    .then(it => queue._storage = it)
  let _queue = P.resolve()
    .then(() => readArray(restoreVaultPlan._queue.restoreKeyPath, parseInt))
    .then(it => queue._queue = it)

  return P.join(_storage, _queue)
    .return(queue)
    .catch(err => {
      let message = `restoreQueue problem!'\
        \n\t queueName: ${queueName}\
        \n\t restorePath: ${restorePath}\
        \n\t originalErr: ${err.message || obj2str(err)}`
      return isObject(err) && isString(err.message)
        ? P.reject(merge(err, { message }))
        : P.reject(new Error(message))
    })
}
