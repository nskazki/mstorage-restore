'use strict'

import { sync as mkdirpSync } from 'mkdirp'
import { tmpNameSync } from 'tmp'
import { merge, isArray, isString, round } from 'lodash'
import { dirname, resolve } from 'path'
import { } from 'console.table'
import P from 'bluebird'
import Logger from 'bellman'
import pretty from 'pretty-ms'
import assert from 'power-assert'
import commander from 'commander'
import tryGc from 'try-gc'

import makeStorage from './makeStorage'
import { store, restore } from '../src-build'

let toList = str => str
  .split(/,|\s+/g)
  .filter(v => v.length)
  .map(parseFloat)
let isType = /^(KV|Queue|HashVault)$/

let cliParams = commander
  .allowUnknownOption()
  .usage(`[options]

    npm run build && npm run t-hl:build
    node \\
      --nouse-idle-notification \\
      --max-old-space-size=4096 \\
      -- test-highload-build/testStorage.js \\
      --type=KV \\
      --range-list="1e3, 1e4, 1e5, 1e6, 1e7"
  `)
  .option('-t, --type <string>', 'allow types: KV, Queue, HashVault', isType)
  .option('-r, --range-list <list of numbers>', 'storage sizes list', toList)
  .parse(process.argv)

if (!isString(cliParams.type) || !isArray(cliParams.rangeList)) {
  commander.help()
  process.reallyExit(0)
}

let getMem = () => `${round(process.memoryUsage().heapUsed/1024/1024, 2)} MB`
let logger = new Logger()
console.info(`type: ${cliParams.type}`)
console.info(`range-list: ${cliParams.rangeList}`)
console.info()

P.resolve(cliParams.rangeList)
  .mapSeries(size => test(cliParams.type, size)
    .then(res => merge({ size }, res))
    .tap(() => console.info(`done - ${size}`))
    .tap(tryGc).delay(1e3))
  .reduce((acc, part) => acc.concat(part), [])
  .then(table => {
    console.info()
    console.info(`${cliParams.type}:`)
    console.table(table)
  })
  .catch(err => logger.error(err))

function test(type, size) {
  let template = resolve(__dirname, '../test-highload-local/restore-XXXXXX')
  mkdirpSync(dirname(template))
  let restorePath = tmpNameSync({ template })

  let creating, storing, restoring, comparing
  let res = {
    created: null, stored: null, restored: null, compared: null,
    afterCreatedMem: null, afterStoredMem: null,
    afterRestoredMem: null, afterComparedMem: null
  }

  creating = Date.now()
  let storage = makeStorage(type, size)
  res.created = pretty(Date.now() - creating)
  res.afterCreatedMem = getMem()

  return P.resolve()
    .then(() => P.resolve()
      .tap(() => storing = Date.now())
      .then(() => store({ storage }, restorePath))
      .tap(() => res.stored = pretty(Date.now() - storing))
      .tap(tryGc).delay(1e3)
      .tap(() => res.afterStoredMem = getMem()))
    .then(() => P.resolve()
      .tap(() => restoring = Date.now())
      .then(() => restore(restorePath))
      .tap(() => res.restored = pretty(Date.now() - restoring))
      .tap(tryGc).delay(1e3)
      .tap(() => res.afterRestoredMem = getMem()))
    .then(it => P.resolve(it)
      .tap(() => comparing = Date.now())
      .then(it => assert.deepStrictEqual(it, { storage }))
      .tap(() => res.compared = pretty(Date.now() - comparing))
      .tap(tryGc).delay(1e3)
      .tap(() => res.afterComparedMem = getMem()))
    .return(res)
}
