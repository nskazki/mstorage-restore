import { KV, Queue } from 'mstorage'
import { store, restore, unstore } from '../src'
import { tmpNameSync } from 'tmp'
import { resolve } from 'path'
import assert from 'power-assert'
import P from 'bluebird'

let template = resolve(__dirname, '../examples-local/restore-XXXXXX')
let restorePath = tmpNameSync({ template })

let _1 = { 1: 1}
let _a = { a: 'a' }

let fooKV = new KV()
let barKV = new KV()
fooKV.add(_1, _a).del(_1).add(_a, _1).add(1, 'a')
barKV.add(1, 'a').delByValue('a').add(1, 'a').add(_1, _a)

let abcQ = new Queue()
let id1 = abcQ.add(_1)
let ida = abcQ.add(_a)
abcQ.toTail(id1).del(ida).add('a')

P.resolve()
  .then(() => store({ fooKV, barKV, abcQ }, restorePath))
  .then(() => restore(restorePath))
  .then(it => assert.deepStrictEqual(it, { fooKV, barKV, abcQ }))
  .then(() => unstore(restorePath))
