# mstorage-restore

```
npm i -S mstorage mstorage-restore
```

Special serializer and deserializer for [mstorage](https://github.com/nskazki/mstorage)

Once I faced the following problem: I needed to serialize couple of millions of records and general purpose libs failed to do this. 8 GB RAM is not enough for JSON to serialization, same for [JSONstream](https://github.com/dominictarr/JSONStream) to deserialization.

### Notes

1. In the process it creates several additional files, so it's better serialize the data to a separate folder.
2. For multiple millions of records be reserved memory:
```
node --max-old-space-size=4096 -- my-app.js
```

### Highload test

On my computer with DDR3 RAM, SSD and i5-2450M 2.50GHz. 
<br>In the process of one core was fully loaded

```
KV:
size      created  stored  restored  compared  afterCreatedMem  afterStoredMem  afterRestoredMem  afterComparedMem
--------  -------  ------  --------  --------  ---------------  --------------  ----------------  ----------------
1000      5ms      17ms    52ms      19ms      20.43 MB         15.6 MB         15.86 MB          15.94 MB        
10000     13ms     29ms    50ms      63ms      16.85 MB         14.66 MB        15.61 MB          15.66 MB        
100000    75ms     126ms   244ms     710ms     30.55 MB         20.2 MB         27.48 MB          27.43 MB        
1000000   583ms    1s      2.6s      7.2s      126.2 MB         76.3 MB         149.8 MB          149.78 MB       
10000000  5.9s     10.8s   21.4s     1m 41.3s  1247.92 MB       665.06 MB       1424.98 MB        1424.79 MB
```

```
Queue:
size      created  stored  restored  compared  afterCreatedMem  afterStoredMem  afterRestoredMem  afterComparedMem
--------  -------  ------  --------  --------  ---------------  --------------  ----------------  ----------------
1000      2ms      12ms    31ms      18ms      20.26 MB         15.57 MB        15.85 MB          15.95 MB        
10000     11ms     38ms    72ms      109ms     15.45 MB         14.65 MB        15.59 MB          15.65 MB        
100000    45ms     123ms   214ms     665ms     26.29 MB         20.2 MB         27.49 MB          27.47 MB        
1000000   437ms    1s      1.8s      8.2s      121.62 MB        76.31 MB        149.8 MB          149.76 MB       
10000000  3.2s     9.8s    18.4s     1m 42.4s  1162.68 MB       665.08 MB       1425.51 MB        1425.3 MB   
```

```
HashVault:
size      created  stored  restored  compared  afterCreatedMem  afterStoredMem  afterRestoredMem  afterComparedMem
--------  -------  ------  --------  --------  ---------------  --------------  ----------------  ----------------
1000      27ms     11ms    18ms      14ms      21.89 MB         15.66 MB        15.83 MB          15.9 MB         
10000     94ms     15ms    39ms      26ms      29.2 MB          14.22 MB        14.49 MB          14.48 MB        
100000    487ms    30ms    76ms      265ms     24.64 MB         15.17 MB        16.26 MB          16.26 MB        
1000000   4.8s     166ms   743ms     2.8s      36.92 MB         23.83 MB        33.81 MB          33.7 MB         
10000000  41.1s    1.5s    5.1s      40.7s     276.23 MB        110.15 MB       223.09 MB         223.06 MB  
```

### Example

```js
import { KV, Queue } from 'mstorage'
import { store, restore, unstoreStrict } from 'mstorage-restore'
import assert from 'assert'
import P from 'bluebird'

let restorePath = 'examples-local/ex1-restore-plan'

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
  .then(() => unstoreStrict(restorePath))
```

### API

* `store(plainObject, path) -> Promise` - can record data types defined in the [mstorage](https://github.com/nskazki/mstorage)
* `exists(path) -> Promise` - like `fs.exists`
* `restore(path) -> Promise` - returns the reconstructed `plainObject`
* `unstore(path) -> Promise` - like `rm $storage-path.*` 
* `unstoreStrict(path) -> Promise` - removes in strict accordance with the recovery plan
* `cp(oldPath, newPath) -> Promise` - just `cp` recovery files
* `mv(oldPath, newPath) -> Promise` - just `mv` recovery files

### Debug and other

If you are interested to look at the structure of the stored data, you can perform: 
```
npm run t-ih
```

If you want to perform load testing locally:
```
npm run t-hl
```

If you want to perform auto test:
```
npm test
```

If you want to debug the process:
```
DEBUG=libs-mstorage-restore* node you-app.js
``` 
