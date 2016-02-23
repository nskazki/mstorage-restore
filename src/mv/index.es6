'use strict'

import {
  unlink as nodeUnlink,
  appendFile as nodeAppendFile } from 'fs'
import {
  readFileSync as readJsonSync,
  writeFileSync as writeJsonSync } from 'jsonfile'
import { inspect } from 'util'
import { dirname } from 'path'
import { get, cloneDeep, keys, assign } from 'lodash'
import { yellow, cyan } from 'chalk'
import P, { promisify } from 'bluebird'
import Debug from 'debug'
import cpFile from 'cp-file'
import nodeTouch from 'touch'
import nodeMkdirp from 'mkdirp'
import exists from '../exists'

let touch = promisify(nodeTouch)
let appendFile = promisify(nodeAppendFile)
let mkdirp = promisify(nodeMkdirp)
let unlink = promisify(nodeUnlink)

let err2str = err => get(err, 'message') || inspect(err)
let touchReflect = path => mkdirp(dirname(path)).reflect().then(prms => prms.isRejected()
  ? prms
  : touch(path).reflect())

let debug = new Debug('libs-mstorage-restore:mv')

export default function mv(oldRestorePath, newRestorePath) {
  debug(`${oldRestorePath} -> ${newRestorePath}`)

  return P.resolve()
    .then(() => exists(oldRestorePath, true))
    .then(({ exist, debugInfo }) => exist
      ? P.resolve()
      : P.reject(new Error(`mv problem: expected files not found: \
          \n\t${debugInfo.map(e => inspect(e).replace(/\n/g, '')).join('\n\t')}`)))
    .then(() => {
      let updatePath = path => path.replace(oldRestorePath, newRestorePath)

      let oldRestorePlan = readJsonSync(oldRestorePath)
      let newRestorePlan = cloneDeep(oldRestorePlan)
        .map(vMeta => assign(vMeta, { restoreVaultPath: updatePath(vMeta.restoreVaultPath) }))

      let oldRestoreVaultPaths = oldRestorePlan.map(vMeta => vMeta.restoreVaultPath)
      let newRestoreVaultPaths = oldRestoreVaultPaths.map(updatePath)

      let oldRestoreVaultPlans = oldRestorePlan.map(vMeta => readJsonSync(vMeta.restoreVaultPath))
      let newRestoreVaultPlans = cloneDeep(oldRestoreVaultPlans)
        .map(vPlan => assign(vPlan, { restoreVaultPath: updatePath(vPlan.restoreVaultPath) }))
        .map(vPlan => assign(vPlan, keys(vPlan)
          .filter(key => /^_/.test(key))
          .map(key => {
            let oldKMeta = vPlan[key]
            let newKMeta = assign(oldKMeta, { restoreKeyPath: updatePath(oldKMeta.restoreKeyPath) })
            return { [ key ]: newKMeta }
          })
          .reduce((acc, part) => assign(acc, part), {})))

      let oldKeyDumpPaths = oldRestoreVaultPlans
        .map(vPlan => keys(vPlan)
          .filter(key => /^_/.test(key))
          .map(key => vPlan[key].restoreKeyPath))
        .reduce((acc, part) => acc.concat(part), [])
      let newKeyDumpPaths = oldKeyDumpPaths.map(updatePath)

      debug(`${yellow('oldRestorePlan')}:\n%s`, inspect(oldRestorePlan, { colors: true }))
      debug(`${cyan('newRestorePlan')}:\n%s`, inspect(newRestorePlan, { colors: true }))
      debug('-------------------------------')
      debug(`${yellow('oldRestoreVaultPaths')}:\n%s`, inspect(oldRestoreVaultPaths, { colors: true }))
      debug(`${cyan('newRestoreVaultPaths')}:\n%s`, inspect(newRestoreVaultPaths, { colors: true }))
      debug('-------------------------------')
      debug(`${yellow('oldRestoreVaultPlans')}:\n%s`, inspect(oldRestoreVaultPlans, { colors: true }))
      debug(`${cyan('newRestoreVaultPlans')}:\n%s`, inspect(newRestoreVaultPlans, { colors: true }))
      debug('-------------------------------')
      debug(`${yellow('oldKeyDumpPaths')}:\n%s`, inspect(oldKeyDumpPaths, { colors: true }))
      debug(`${cyan('newKeyDumpPaths')}:\n%s`, inspect(newKeyDumpPaths, { colors: true }))

      let canCreate = [ newRestorePath, ...newRestoreVaultPaths, ...newKeyDumpPaths ]
        .map(path => ({ path, type: 'create', prms: touchReflect(path) }))
      let canDelete = [ oldRestorePath, ...oldRestoreVaultPaths, ...oldKeyDumpPaths ]
        .map(path => ({ path, type: 'delete', prms: appendFile(path, '').reflect() }))

      let problems = P
        .all([ ...canCreate, ...canDelete ])
        .map(check => check.prms.then(res => res.isRejected()
          ? assign(check, { isRejected: true, error: res.reason() })
          : assign(check, { isRejected: false })))
        .filter(check => check.isRejected)
        .map(check => `\t can't ${check.type}!\
          \n\t\t path: ${check.path}\
          \n\t\t error: ${err2str(check.error)}`)

      return problems
        .then(errs => errs.length === 0
          ? P.resolve()
          : P.reject(new Error(`mv problem: exec is not possible!\
              \n\t new files - not completely created\
              \n\t old files - not damaged\
              \n\t oldRestorePath: ${oldRestorePath}\
              \n\t newRestorePath: ${newRestorePath}\
              \n${errs.join('\n')}`)))
        .then(() => {
          return P.try(() => {
            writeJsonSync(newRestorePath, newRestorePlan, { spaces: 2 })
            newRestoreVaultPaths.forEach((path, index) => {
              let vPlan = newRestoreVaultPlans[index]
              writeJsonSync(path, vPlan, { spaces: 2 })
            })
          }).catch(err => P.reject(new Error(`mv problem: exec is not finished!\
            \n\t new files - not completely created\
            \n\t old filed - not damaged\
            \n\t oldRestorePath: ${oldRestorePath}\
            \n\t newRestorePath: ${newRestorePath}\
            \n\t error: ${err2str(err)} `)))
        })
        .then(() => {
          return P.map(newKeyDumpPaths, (newPath, index) => {
            let oldPath = oldKeyDumpPaths[index]
            return cpFile(oldPath, newPath)
          }).catch(err => P.reject(new Error(`mv problem: exec is not finished!\
            \n\t new files - not completely created\
            \n\t old files - not damaged\
            \n\t oldRestorePath: ${oldRestorePath}\
            \n\t newRestorePath: ${newRestorePath}\
            \n\t error: ${err2str(err)} `)))
        })
        .then(() => {
          let deleted = [
            unlink(oldRestorePath),
            ...oldRestoreVaultPaths.map(path => unlink(path)),
            ...oldKeyDumpPaths.map(path => unlink(path))
          ]

          return P
            .all(deleted)
            .catch(err => P.reject(new Error(`mv problem: exec is not finished!\
              \n\t new files - was created\
              \n\t old files - damaged, not completely removed\
              \n\t oldRestorePath: ${oldRestorePath}\
              \n\t newRestorePath: ${newRestorePath}\
              \n\t error: ${err2str(err)} `)))
        })
    })
}
