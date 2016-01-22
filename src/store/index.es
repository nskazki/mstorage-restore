'use strict'

import { existsSync } from 'fs'
import { keys, isFunction, omit } from 'lodash'
import { dirname } from 'path'
import P, { promisify } from 'bluebird'
import Debug from 'debug'
import mkdirpNode from 'mkdirp'

import storeHashVault from './storeHashVault'
import storeQueue from './storeQueue'
import storeKV from './storeKV'

let debug = new Debug('libs-restore-mstorage:store')
let mkdirp = promisify(mkdirpNode)
let type2storer = {
  'HashVault': storeHashVault,
  'Queue': storeQueue,
  'KV': storeKV
}

export default function store(vaults, restorePath) {
  debug('restorePath: %j', restorePath)
  debug('vaults: %j', keys(vaults))

  if (existsSync(restorePath))
    return P.reject(new Error(`store problem: restorePath already exist!\
      \n\t vaultNames: ${keys(vaults)}\
      \n\t restorePath: ${restorePath}`))

  return P.resolve()
    .then(() => mkdirp(dirname(restorePath)))
    .return(keys(vaults))
    .map(vaultName => ({
      vaultName,
      vaultType: vaults[vaultName].constructor.name,
      vault: vaults[vaultName]
    }))
    .map(meta => {
      debug('vault: %j', omit(meta, 'vault'))

      let store = type2storer[meta.vaultType]
      if (!isFunction(store))
        return P.reject(new Error(`store problem: unexpected vault type!\
          \n\t vaultName: ${meta.vaultName}\
          \n\t vaultType: ${meta.vaultType}\
          \n\t restorePath: ${restorePath}`))

      return store(meta.vault, meta.vaultName, restorePath)
    })
}
