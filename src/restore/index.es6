'use strict'

import { inspect } from 'util'
import { readFileSync as readJsonSync } from 'jsonfile'
import { assign, isFunction } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'
import exists from '../exists'

import restoreHashVault from './restoreHashVault'
import restoreQueue from './restoreQueue'
import restoreKV from './restoreKV'

let debug = new Debug('libs-mstorage-restore:restore')
let type2restore = {
  'HashVault': restoreHashVault,
  'Queue': restoreQueue,
  'KV': restoreKV
}

export default function restore(restorePath) {
  debug('restorePath: %j', restorePath)

  return P.resolve()
    .then(() => exists(restorePath, true))
    .then(({ exist, defugInfo }) => exist
      ? P.resolve()
      : P.reject(new Error(`expected files not found: ${inspect(defugInfo)}`)))
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
