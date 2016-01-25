# mstorage-restore

```
npm i -S mstorage mstorage-restore
```

```js
import { KV } from 'mstorage'
import { store, restore } from 'mstorage-restore'
import { range } from 'lodash'

let kv = new KV()
let restorePath = 'example-local/restore-plan'

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
```
