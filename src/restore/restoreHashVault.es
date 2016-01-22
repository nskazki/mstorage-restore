'use strict'

import { createReadStream } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { chain, isString, isObject, merge } from 'lodash'
import { HashVault } from 'mstorage'
import P from 'bluebird'
import Debug from 'debug'
import e2p from 'simple-e2p'
import split from 'split'

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
    .then(() => restore_array(restoreVaultPlan._array.restoreKeyPath))
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

function restore_array(restoreKeyPath) {
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
