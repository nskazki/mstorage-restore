'use strict'

import { store, restore } from '../src'
import { Queue } from 'mstorage'
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

describe('Queue', () => {
  it('one vault with few pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooQ = new Queue()
    fooQ.add(_0)
    fooQ.add(_1)
    fooQ.add(_2)
    fooQ.delByValue(_0)
    fooQ.delByValue(_1)
    fooQ.add(_3)
    fooQ.del(2)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('one vault with few another pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooQ = new Queue()
    fooQ.add(0)
    fooQ.add(1)
    fooQ.add(2)
    fooQ.delByValue(0)
    fooQ.delByValue(1)
    fooQ.add(3)
    fooQ.del(2)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('one vault without data', () => {
    let restorePath = tmpNameSync({ template })
    let fooQ = new Queue()

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('one vault with undefined keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooQ = new Queue()

    fooQ.add(undefined)
    fooQ.delByValue(undefined)
    fooQ.add(undefined)
    fooQ.delByValue(undefined)
    fooQ.add(undefined)
    let id3 = fooQ.add(3)
    fooQ.add(undefined)
    fooQ.toTail(id3)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('one vault with null keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooQ = new Queue()

    fooQ.add(null)
    fooQ.delByValue(null)
    let id1 = fooQ.add(null)
    fooQ.del(id1)
    fooQ.add(null)
    let id3 = fooQ.add(_3)
    fooQ.add(null)
    fooQ.toHead(id3)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('one vault with NaN values', () => {
    let restorePath = tmpNameSync({ template })
    let fooQ = new Queue()

    let id0 = fooQ.add(NaN)
    let id1 = fooQ.add(NaN)
    let id2 = fooQ.add(_c)
    fooQ.add(NaN)
    fooQ.del(id0)
    fooQ.toTail(id2)
    fooQ.del(id1)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert(isEqual(it, { fooQ })))
  })

  it('one vault with Infinity keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooQ = new Queue()

    let id0 = fooQ.add(Infinity)
    let id1 = fooQ.add(1)
    fooQ.add(Infinity)
    let id3 = fooQ.add(_d)
    fooQ.toTail(id1)
    fooQ.toHead(id3)
    fooQ.del(id0)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })

  it('few vaults with random keys and values', () => {
    let restorePath = tmpNameSync({ template })

    let fooQ = new Queue()
    let barQ = new Queue()
    let abcQ = new Queue()

    fooQ.add(0)
    fooQ.add(_b)
    fooQ.add(_2)
    fooQ.add(undefined)
    fooQ.add(_d)

    barQ.add(_0)
    barQ.add(NaN)
    barQ.add(undefined)
    barQ.add(null)
    barQ.add(null)
    barQ.add('2')

    abcQ.add(_a)
    abcQ.add('b')
    abcQ.add(undefined)
    abcQ.add(null)
    abcQ.delByValue(_a)
    abcQ.delByValue('b')
    abcQ.delByValue(undefined)
    abcQ.delByValue(null)

    return P.resolve()
      .then(() => store({ fooQ }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooQ }))
  })
})
