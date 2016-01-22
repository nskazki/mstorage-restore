'use strict'

import { createReadStream } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { Queue } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import e2p from 'simple-e2p'
import split from 'split'

let debug = new Debug('libs-restore-mstorage:restoreQueue')
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
  return P.resolve()
    .then(() => restore_storage(restoreVaultPlan._storage.restoreKeyPath))
    .then(it => queue._storage = it)
    .then(() => restore_queue(restoreVaultPlan._queue.restoreKeyPath))
    .then(it => queue._queue = it)
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

function restore_storage(restoreKeyPath) {
  let summ = []
  let readf = createReadStream(restoreKeyPath, { encoding: 'utf8' })
  let parse = readf
    .pipe(split())
    .on('data', line => {
      if (/^\s*$/.test(line)) return
      if (line === 'undefined') {
        summ.push(undefined)
        delete summ[summ.length - 1]
      } else {
        summ.push(str2obj(line))
      }
    })

  return P.join(
    e2p(readf, 'end', 'error'),
    e2p(parse, 'end', 'error')
  ).return(summ)
}

function restore_queue(restoreKeyPath) {
  let summ = []
  let readf = createReadStream(restoreKeyPath, { encoding: 'utf8' })
  let parse = readf
    .pipe(split())
    .on('data', line => {
      if (/^\s*$/.test(line)) return
      summ.push(parseInt(line))
    })

  return P.join(
    e2p(readf, 'end', 'error'),
    e2p(parse, 'end', 'error')
  ).return(summ)
}
