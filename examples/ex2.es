import { KV } from 'mstorage'
import { store, restore } from '../src'
import { tmpNameSync } from 'tmp'
import { resolve } from 'path'
import { range } from 'lodash'
import assert from 'power-assert'
import P from 'bluebird'

let template = resolve(__dirname, '../examples-local/restore-XXXXXX')
let restorePath = tmpNameSync({ template })
let kv = new KV()

console.time('mapped!')
range(0, 1e6)
  .map(el => ({ el }))
  .forEach((k, v) => kv.add(k, v))
console.timeEnd('mapped!')

P.resolve()
  .then(() => P.resolve()
    .tap(() => console.time('stored!'))
    .then(() => store({ kv }, restorePath))
    .tap(() => console.timeEnd('stored!')))
  .then(() => P.resolve()
    .tap(() => console.time('restored!'))
    .then(() => restore(restorePath))
    .tap(() => console.timeEnd('restored!')))
  .then(it => P.resolve(it)
    .tap(() => console.time('compared!'))
    .then(it => assert.deepStrictEqual(it, { kv }))
    .tap(() => console.timeEnd('compared!')))
  .catch(err => console.error(err))
