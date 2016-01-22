'use strict'

import { existsSync } from 'fs'
import { readFileSync as readJsonSync,
  writeFileSync as writeJsonSync } from 'jsonfile'
import { isArray, isObject,
  isString, merge, snakeCase } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'
import writeArray from './writeArray'

let debug = new Debug('libs-restore-mstorage:storeKV')
let obj2str = JSON.stringify

export default function storeKV(kv, kvName, restorePath) {
  return P.try(() => {
    if (!isArray(kv._keys) && !isArray(kv._values))
      return P.reject(new Error(`storeKV Problem: first arg must be a KV!`))

    let restorePlanBase = existsSync(restorePath)
      ? readJsonSync(restorePath)
      : []

    let restoreVaultPath = `${restorePath}.KV.${snakeCase(kvName)}`
    let restorePlanSumm = restorePlanBase.concat({
      restoreVaultType: 'KV',
      restoreVaultName: kvName,
      restoreVaultPath
    })

    writeJsonSync(restorePath, restorePlanSumm, { spaces: 2 })

    let restoreVaultPlan = buildVaultPlan(kvName, restoreVaultPath)
    writeJsonSync(restoreVaultPath, restoreVaultPlan, { spaces: 2 })

    debug(`kv: ${kvName}`)
    debug(`  restoreVaultPath: ${restoreVaultPath}`)
    debug(`  v.restoreKeyPath: ${restoreVaultPlan._values.restoreKeyPath}`)
    debug(`  k.restoreKeyPath: ${restoreVaultPlan._keys.restoreKeyPath}`)

    return P.join(
      writeArray(kv._values, restoreVaultPlan._values.restoreKeyPath, obj2str),
      writeArray(kv._keys, restoreVaultPlan._keys.restoreKeyPath, obj2str))
  }).catch(err => {
    let message = `storeKV problem!'\
      \n\t kvSize: ${kv.size()}\
      \n\t kvName: ${kvName}\
      \n\t restorePath: ${restorePath}\
      \n\t originalErr: ${err.message || obj2str(err)}`
    return isObject(err) && isString(err.message)
      ? P.reject(merge(err, { message }))
      : P.reject(new Error(message))
  })
}

function buildVaultPlan(kvName, restoreVaultPath) {
  return {
    restoreVaultType: 'KV',
    restoreVaultName: kvName,
    restoreVaultPath,

    _keys: {
      restoreKeyPath: `${restoreVaultPath}._keys`,
      restoreKeyName: '_keys'
    },
    _values: {
      restoreKeyPath: `${restoreVaultPath}._values`,
      restoreKeyName: '_values'
    }
  }
}
