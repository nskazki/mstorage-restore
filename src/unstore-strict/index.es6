'use strict'

import {
  unlink as nodeUnlink,
  appendFile as nodeAppendFile } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { inspect } from 'util'
import { get, keys, assign } from 'lodash'
import { red } from 'chalk'
import P, { promisify } from 'bluebird'
import Debug from 'debug'
import exists from '../exists'

let appendFile = promisify(nodeAppendFile)
let unlink = promisify(nodeUnlink)

let err2str = err => get(err, 'message') || inspect(err)
let debug = new Debug('libs-mstorage-restore:unstoreStrict')

export default function unstoreStrict(oldRestorePath) {
  debug(`restorePath: ${oldRestorePath}`)

  return P.resolve()
    .then(() => exists(oldRestorePath, true))
    .then(({ exist, debugInfo }) => exist
      ? P.resolve()
      : P.reject(new Error(`unstoreStrict problem: expected files not found: \
          \n\t${debugInfo.map(e => inspect(e).replace(/\n/g, '')).join('\n\t')}`)))
    .then(() => {
      let oldRestorePlan = readJsonSync(oldRestorePath)
      let oldRestoreVaultPaths = oldRestorePlan.map(vMeta => vMeta.restoreVaultPath)
      let oldRestoreVaultPlans = oldRestorePlan.map(vMeta => readJsonSync(vMeta.restoreVaultPath))
      let oldKeyDumpPaths = oldRestoreVaultPlans
        .map(vPlan => keys(vPlan)
          .filter(key => /^_/.test(key))
          .map(key => vPlan[key].restoreKeyPath))
        .reduce((acc, part) => acc.concat(part), [])

      debug(`${red('oldRestorePlan')}:\n%s`, inspect(oldRestorePlan, { colors: true }))
      debug('-------------------------------')
      debug(`${red('oldRestoreVaultPaths')}:\n%s`, inspect(oldRestoreVaultPaths, { colors: true }))
      debug('-------------------------------')
      debug(`${red('oldRestoreVaultPlans')}:\n%s`, inspect(oldRestoreVaultPlans, { colors: true }))
      debug('-------------------------------')
      debug(`${red('oldKeyDumpPaths')}:\n%s`, inspect(oldKeyDumpPaths, { colors: true }))

      let canDelete = [ oldRestorePath, ...oldRestoreVaultPaths, ...oldKeyDumpPaths ]
        .map(path => ({ path, type: 'delete', prms: appendFile(path, '').reflect() }))

      let problems = P
        .all(canDelete)
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
          : P.reject(new Error(`unstoreStrict problem: exec is not possible!\
              \n\t old files - not damaged\
              \n\t oldRestorePath: ${oldRestorePath}\
              \n${errs.join('\n')}`)))
        .then(() => {
          let deleted = [
            unlink(oldRestorePath),
            ...oldRestoreVaultPaths.map(path => unlink(path)),
            ...oldKeyDumpPaths.map(path => unlink(path))
          ]

          return P
            .all(deleted)
            .catch(err => P.reject(new Error(`unstoreStrict problem: exec is not finished!\
              \n\t old files - damaged, not completely removed\
              \n\t oldRestorePath: ${oldRestorePath}\
              \n\t error: ${err2str(err)} `)))
        })
    })
}

