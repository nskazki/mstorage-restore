'use strict'

import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { KV } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import readArray from './readArray'

let debug = new Debug('libs-mstorage-restore:restoreKV')
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
  let _keys = P.resolve()
    .then(() => readArray(restoreVaultPlan._keys.restoreKeyPath, str2obj))
    .tap(it => it.length === restoreVaultPlan._keys.dumpLength
      ? P.resolve()
      : P.reject(new Error(`restoreKV problem: unexpected _keys dump size\
          \n\t expected dump size: ${restoreVaultPlan._keys.dumpLength}\
          \n\t actual dump size: ${it.length}\
          \n\t actual dump path: ${restoreVaultPlan._keys.restoreKeyPath}`)))
    .then(it => kv._keys = it)
  let _values = P.resolve()
    .then(() => readArray(restoreVaultPlan._values.restoreKeyPath, str2obj))
    .tap(it => it.length === restoreVaultPlan._values.dumpLength
      ? P.resolve()
      : P.reject(new Error(`restoreKV problem: unexpected _values dump size\
          \n\t expected dump size: ${restoreVaultPlan._values.dumpLength}\
          \n\t actual dump size: ${it.length}\
          \n\t actual dump path: ${restoreVaultPlan._values.restoreKeyPath}`)))
    .then(it => kv._values = it)

  return P.join(_keys, _values)
    .return(kv)
    .catch(err => {
      let message = `restoreKV problem!\
        \n\t kvName: ${kvName}\
        \n\t restorePath: ${restorePath}\
        \n\t originalErr: ${err.message || obj2str(err)}`
      return isObject(err) && isString(err.message)
        ? P.reject(merge(err, { message }))
        : P.reject(new Error(message))
    })
}
