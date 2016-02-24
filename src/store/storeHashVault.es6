'use strict'

import { existsSync } from 'fs'
import { readFileSync as readJsonSync,
  writeFileSync as writeJsonSync } from 'jsonfile'
import { isArray, isObject,
  isString, merge, snakeCase } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'
import writeArray from './writeArray'

let debug = new Debug('libs-mstorage-restore:storeHashVault')
let obj2str = JSON.stringify

export default function storeHashVault(hashVault, hashVaultName, restorePath) {
  return P.try(() => {
    if (!isArray(hashVault._array))
      return P.reject(new Error(`storeHashVault Problem: first arg must be a HashVault!`))

    let restorePlanBase = existsSync(restorePath)
      ? readJsonSync(restorePath)
      : []

    let restoreVaultPath = `${restorePath}.HashVault.${snakeCase(hashVaultName)}`
    let restorePlanSumm = restorePlanBase.concat({
      restoreVaultType: 'HashVault',
      restoreVaultName: hashVaultName,
      restoreVaultPath
    })

    writeJsonSync(restorePath, restorePlanSumm, { spaces: 2 })

    let restoreVaultPlan = buildVaultPlan(hashVault, hashVaultName, restoreVaultPath)
    writeJsonSync(restoreVaultPath, restoreVaultPlan, { spaces: 2 })

    debug(`hashVault: ${hashVaultName}`)
    debug(`  restoreVaultPath: ${restoreVaultPath}`)
    debug(`  a.restoreKeyPath: ${restoreVaultPlan._array.restoreKeyPath}`)

    return writeArray(hashVault._array, restoreVaultPlan._array.restoreKeyPath)
  }).catch(err => {
    let message = `storeHashVault problem!'\
      \n\t hashVaultSize: ${hashVault.size()}\
      \n\t hashVaultName: ${hashVaultName}\
      \n\t restorePath: ${restorePath}\
      \n\t originalErr: ${err.message || obj2str(err)}`
    return isObject(err) && isString(err.message)
      ? P.reject(merge(err, { message }))
      : P.reject(new Error(message))
  })
}

function buildVaultPlan(hashVault, hashVaultName, restoreVaultPath) {
  return {
    restoreVaultType: 'HashVault',
    restoreVaultName: hashVaultName,
    restoreVaultPath,

    _array: {
      dumpLength: hashVault._array.length,
      restoreKeyPath: `${restoreVaultPath}._array`,
      restoreKeyName: '_array'
    }
  }
}
