'use strict'

import { HashVault } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { inspect as inspectSimple } from 'util'
import { forEach, isObject } from 'lodash'
import Logger from 'bellman'
import assert from 'power-assert'

import storeHashVault from '../libs/storeHashVault'
import restoreHashVault from '../libs/restoreHashVault'

let logger = new Logger()
let inspect = v => inspectSimple(v, { colors: true, depth: null })
let restorePath = resolve(__dirname, './v2-restore')
let hashVault = new HashVault()

hashVault.add({ 0: 0 })
hashVault.add({ 1: 1 })
hashVault.add({ 2: 2 })
hashVault.add({ 3: 3 })
hashVault.add({ 4: 4 })

hashVault.delByValue({ 2: 2 })
hashVault.delByValue({ 3: 3 })

hashVault.add({ 5: 5 })
hashVault.add({ 6: 6 })

console.info('HashVault:', inspect(hashVault))
console.info()

if (existsSync(restorePath)) unlinkSync(restorePath)
storeHashVault(hashVault, 'some-name', restorePath)
  .then(() => console.info('stored!'))
  .then(() => inspectRestoreFiles(restorePath))
  .then(() => restoreHashVault('some-name', restorePath))
  .tap(() => console.info('HashVault:', inspect(hashVault)))
  .tap(it => assert.deepStrictEqual(it, hashVault))
  .catch(err => logger.error(err))

function inspectRestoreFiles(restorePath) {
  let restorePlan = readJsonSync(restorePath)
  console.info('restorePlan:', inspect(restorePlan))
  console.info()

  restorePlan.forEach(restorePlanChunk => {
    console.info('restorePlanChunk:', inspect(restorePlanChunk))
    console.info()

    let restoreVaultPath = restorePlanChunk.restoreVaultPath
    let restoreVaultPlan = readJsonSync(restoreVaultPath)
    console.info('restoreVaultPlan:', inspect(restoreVaultPlan))
    console.info()

    forEach(restoreVaultPlan, restoreKeyPlan => {
      if (!isObject(restoreKeyPlan)) return
      console.info('restoreKeyPlan:', inspect(restoreKeyPlan))
      console.info()

      let restoreKeyDump = readFileSync(restoreKeyPlan.restoreKeyPath, { encoding: 'utf8' })
      console.info('restoreKeyDump:\n%s', restoreKeyDump)
    })
  })
}
