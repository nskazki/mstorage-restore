'use strict'

import { store, restore } from '../src'
import { KV } from 'mstorage'
import { tmpNameSync } from 'tmp'
import { dirname, resolve } from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import { isEqual } from 'lodash'
import P from 'bluebird'
import assert from 'power-assert'

let template = resolve(__dirname, '../test-local/restore-XXXXXX')
mkdirpSync(dirname(template))

let _0 = { 0: 0 }
let _1 = { 1: 1 }
let _2 = { 2: 2 }
let _3 = { 3: 3 }
let _a = { a: 'a' }
let _b = { b: 'b' }
let _c = { c: 'c' }
let _d = { d: 'd' }

describe('KV', () => {
  it('one vault with few pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooKV = new KV()
    fooKV.add(_0, 0)
    fooKV.add(_1, 1)
    fooKV.add(_2, 2)
    fooKV.delByValue(0)
    fooKV.del(_2)
    fooKV.add(_3, 3)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('one vault with few another pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooKV = new KV()
    fooKV.add(0, _a)
    fooKV.add(1, _b)
    fooKV.del(1)
    fooKV.delByValue(_a)
    fooKV.add(2, _c)
    fooKV.add(3, _d)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('one vault without data', () => {
    let restorePath = tmpNameSync({ template })
    let fooKV = new KV()

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('one vault with undefined keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooKV = new KV()

    fooKV.add(undefined, 0)
    fooKV.delByValue(0)
    fooKV.add(undefined, 0)
    fooKV.add(0, undefined)
    fooKV.delByValue(undefined)
    fooKV.add(0, undefined)
    fooKV.add(undefined, undefined)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('one vault with null keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooKV = new KV()

    fooKV.add(null, 0)
    fooKV.delByValue(0)
    fooKV.add(null, 0)
    fooKV.add(0, null)
    fooKV.delByValue(null)
    fooKV.add(0, null)
    fooKV.add(null, null)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('one vault with NaN values', () => {
    let restorePath = tmpNameSync({ template })
    let fooKV = new KV()

    fooKV.add(0, NaN)
    fooKV.del(0)
    fooKV.add(0, NaN)
    fooKV.add(1, NaN)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert(isEqual(it, { fooKV })))
  })

  it('one vault with Infinity keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooKV = new KV()

    fooKV.add(Infinity, 0)
    fooKV.delByValue(0)
    fooKV.add(Infinity, 0)
    fooKV.add(0, Infinity)
    fooKV.delByValue(Infinity)
    fooKV.add(0, Infinity)
    fooKV.add(Infinity, Infinity)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })

  it('few vaults with random keys and values', () => {
    let restorePath = tmpNameSync({ template })

    let fooKV = new KV()
    let barKV = new KV()
    let abcKV = new KV()

    fooKV.add(undefined, _a)
    fooKV.add(_a, undefined)
    fooKV.add(undefined, undefined)
    fooKV.add(0, undefined)
    fooKV.add(undefined, 0)

    barKV.add(_0, _a)
    barKV.add(_1, _b)
    barKV.add(undefined, NaN)
    barKV.add(null, NaN)
    barKV.add(_2, _c)

    abcKV.add(_0, _a)
    abcKV.add(1, 'b')
    abcKV.add(undefined, undefined)
    abcKV.add(null, null)
    abcKV.del(_0)
    abcKV.delByValue('b')
    abcKV.del(undefined)
    abcKV.delByValue(null)

    return P.resolve()
      .then(() => store({ fooKV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooKV }))
  })
})
