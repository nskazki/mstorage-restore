'use strict'

import { createReadStream } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { KV } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import e2p from 'simple-e2p'
import split from 'split'

let debug = new Debug('libs-restore-mstorage:restoreKV')
let obj2str = JSON.stringify
let str2obj = JSON.parse

export default function restoreKV(kvName, restorePath) {
  let restorePlan = readJsonSync(restorePath)

  let restoreVaultPath = chain(restorePlan)
    .filter(({ restoreVaultType }) => restoreVaultType === 'KV')
    .filter(({ restoreVaultName }) => restoreVaultName === kvName)
    .first().get('restoreVaultPath').value()

  if (!isString(restoreVaultPath))
    return P.reject(new Error(`restoreKV problem: restoreVaultPath not found!\
      \n\t kvName: ${kvName}\
      \n\t restorePath: ${restorePath}`))

  let restoreVaultPlan = readJsonSync(restoreVaultPath)

  debug(`kv: ${kvName}`)
  debug(`  restoreVaultPath: ${restoreVaultPath}`)
  debug(`  v.restoreKeyPath: ${restoreVaultPlan._values.restoreKeyPath}`)
  debug(`  k.restoreKeyPath: ${restoreVaultPlan._keys.restoreKeyPath}`)

  let kv = new KV()
  return P.resolve()
    .then(() => restore_keys(restoreVaultPlan._keys.restoreKeyPath))
    .then(it => kv._keys = it)
    .then(() => restore_values(restoreVaultPlan._values.restoreKeyPath))
    .then(it => kv._values = it)
    .return(kv)
    .catch(err => {
      let message = `restoreKV problem!'\
        \n\t kvName: ${kvName}\
        \n\t restorePath: ${restorePath}\
        \n\t originalErr: ${err.message || obj2str(err)}`
      return isObject(err) && isString(err.message)
        ? P.reject(merge(err, { message }))
        : P.reject(new Error(message))
    })
}

function restore_keys(restoreKeyPath) {
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

function restore_values(restoreKeyPath) {
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
