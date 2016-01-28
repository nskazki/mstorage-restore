'use strict'

import { KV, Queue, HashVault } from 'mstorage'
import { range } from 'lodash'

export default function makeStorage(type, size) {
  return type2func[type](size)
}

let type2func = {
  KV: makeKV,
  Queue: makeQueue,
  HashVault: makeHashVault
}

function makeKV(size) {
  let kv = new KV()
  range(0, size)
    .map(el => ({ el }))
    .forEach((k, v) => kv.add(k, v))
  return kv
}

function makeQueue(size) {
  let queue = new Queue()
  range(0, size)
    .map(el => ({ el }))
    .forEach(el => queue.add(el))
  return queue
}

function makeHashVault(size) {
  let hashVault = new HashVault()
  let arr = range(0, size).map(el => { el })
  hashVault.init(arr)
  return hashVault
}
