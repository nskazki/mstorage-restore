'use strict'

import { KV } from 'mstorage'
import { resolve } from 'path'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { inspect as inspectSimple } from 'util'
import { forEach, isObject } from 'lodash'
import Logger from 'bellman'
import assert from 'power-assert'

import storeKV from '../src/store/storeKV'
import restoreKV from '../src/restore/restoreKV'

let logger = new Logger()
let inspect = v => inspectSimple(v, { colors: true, depth: null })
let restorePath = resolve(__dirname, '../test-inspecth-local/restore-load')
let kv = new KV()

let a = { a: 'a' }
let b = { b: 'b' }
let c = { c: 'c' }
let d = { d: 'd' }
let e = { e: 'e' }

let _0 = { 0: 0 }
let _1 = { 1: 1 }
let _2 = { 2: 2 }
let _3 = { 3: 3 }
let _4 = { 4: 4 }

kv.add(a, _0)
kv.add(b, _1)
kv.add(c, _2)
kv.add(d, _3)

kv.del(b)
kv.delByValue(_2)

kv.add(e, _4)

console.info('KV:', inspect(kv))
console.info()

if (existsSync(restorePath)) unlinkSync(restorePath)
storeKV(kv, 'some-name', restorePath)
  .then(() => console.info('stored!'))
  .then(() => inspectRestoreFiles(restorePath))
  .then(() => restoreKV('some-name', restorePath))
  .tap(() => console.info('KV:', inspect(kv)))
  .tap(it => assert.deepStrictEqual(it, kv))
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
