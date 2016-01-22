'use strict'

import { existsSync } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { assign, isFunction } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'

import restoreHashVault from './restoreHashVault'
import restoreQueue from './restoreQueue'
import restoreKV from './restoreKV'

let debug = new Debug('libs-restore-mstorage:restore')
let type2restore = {
  'HashVault': restoreHashVault,
  'Queue': restoreQueue,
  'KV': restoreKV
}

export default function restore(restorePath) {
  debug('restorePath: %j', restorePath)

  if (!existsSync(restorePath))
    return P.reject(new Error(`restore problem: restorePath not exist!\
      \n\t restorePath: ${restorePath}`))

  return P.resolve()
    .then(() => readJsonSync(restorePath))
    .map(meta => {
      debug(`vault: ${meta.restoreVaultName}`)
      debug(`  restoreVaultPath: ${meta.restoreVaultPath}`)
      debug(`  restoreVaultType: ${meta.restoreVaultType}`)

      let restore = type2restore[meta.restoreVaultType]
      if (!isFunction(restore))
        return P.reject(new Error(`restore problem: unexpected vault type!\
          \n\t vaultMeta: ${meta}\
          \n\t restorePath: ${restorePath}`))

      return P.resolve()
        .then(() => restore(meta.restoreVaultName, restorePath))
        .then(it => ({ [ meta.restoreVaultName ]: it }))
    })
    .reduce((acc, part) => assign(acc, part), {})
}
