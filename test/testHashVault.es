'use strict'

import { store, restore } from '../src'
import { HashVault } from 'mstorage'
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

describe('HashVault', () => {
  it('one vault with few pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooHV = new HashVault()
    fooHV.add(_0)
    fooHV.add(_1)
    let id2 = fooHV.add(_2)
    fooHV.delByValue(_0)
    fooHV.delByValue(_1)
    fooHV.add(_3)
    fooHV.del(id2)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('one vault with few another pairs', () => {
    let restorePath = tmpNameSync({ template })

    let fooHV = new HashVault()
    fooHV.add(0)
    fooHV.add(1)
    let id2 = fooHV.add(2)
    fooHV.delByValue(0)
    fooHV.delByValue(1)
    fooHV.add(3)
    fooHV.del(id2)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('one vault without data', () => {
    let restorePath = tmpNameSync({ template })
    let fooHV = new HashVault()

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('one vault with undefined keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooHV = new HashVault()

    fooHV.add(undefined)
    fooHV.delByValue(undefined)
    fooHV.add(undefined)
    fooHV.delByValue(undefined)
    fooHV.add(undefined)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('one vault with null keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooHV = new HashVault()

    fooHV.add(null)
    fooHV.delByValue(null)
    let id1 = fooHV.add(null)
    fooHV.del(id1)
    fooHV.add(null)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('one vault with NaN values', () => {
    let restorePath = tmpNameSync({ template })
    let fooHV = new HashVault()

    let id0 = fooHV.add(NaN)
    let id1 = fooHV.add(NaN)
    let id2 = fooHV.add(_c)
    fooHV.add(NaN)
    fooHV.del(id0)
    fooHV.del(id2)
    fooHV.del(id1)
    fooHV.add(NaN)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert(isEqual(it, { fooHV })))
  })

  it('one vault with Infinity keys and values', () => {
    let restorePath = tmpNameSync({ template })
    let fooHV = new HashVault()

    let id0 = fooHV.add(Infinity)
    fooHV.add(1)
    fooHV.add(Infinity)
    fooHV.add(_d)
    fooHV.del(id0)

    return P.resolve()
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })

  it('few vaults with random keys and values', () => {
    let restorePath = tmpNameSync({ template })

    let fooHV = new HashVault()
    let barQ = new HashVault()
    let abcQ = new HashVault()

    fooHV.add(0)
    fooHV.add(_b)
    fooHV.add(_2)
    fooHV.add(undefined)
    fooHV.add(_d)

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
      .then(() => store({ fooHV }, restorePath))
      .then(() => restore(restorePath))
      .then(it => assert.deepStrictEqual(it, { fooHV }))
  })
})
