'use strict'

import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { HashVault } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import readArray from './readArray'

let debug = new Debug('libs-restore-mstorage:restoreHashVault')
let obj2str = JSON.stringify

export default function restoreHashVault(hashVaultName, restorePath) {
  let restorePlan = readJsonSync(restorePath)

  let restoreVaultPath = chain(restorePlan)
    .filter(({ restoreVaultType }) => restoreVaultType === 'HashVault')
    .filter(({ restoreVaultName }) => restoreVaultName === hashVaultName)
    .first().get('restoreVaultPath').value()

  if (!isString(restoreVaultPath))
    return P.reject(new Error(`restoreHashVault problem: restoreVaultPath not found!\
      \n\t hashVaultName: ${hashVaultName}\
      \n\t restorePath: ${restorePath}`))

  let restoreVaultPlan = readJsonSync(restoreVaultPath)

  debug(`hashVault: ${hashVaultName}`)
  debug(`  restoreVaultPath: ${restoreVaultPath}`)
  debug(`  a.restoreKeyPath: ${restoreVaultPlan._array.restoreKeyPath}`)

  let hashVault = new HashVault()
  return P.resolve()
    .then(() => readArray(restoreVaultPlan._array.restoreKeyPath, parseInt))
    .then(it => hashVault._array = it)
    .return(hashVault)
    .catch(err => {
      let message = `restoreHashVault problem!'\
        \n\t hashVaultName: ${hashVaultName}\
        \n\t restorePath: ${restorePath}\
        \n\t originalErr: ${err.message || obj2str(err)}`
      return isObject(err) && isString(err.message)
        ? P.reject(merge(err, { message }))
        : P.reject(new Error(message))
    })
}
