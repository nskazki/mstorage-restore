'use strict'

import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { KV } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import readArray from './readArray'

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
    .then(() => readArray(restoreVaultPlan._keys.restoreKeyPath, str2obj))
    .then(it => kv._keys = it)
    .then(() => readArray(restoreVaultPlan._values.restoreKeyPath, str2obj))
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
