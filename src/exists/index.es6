'use strict'

import { existsSync } from 'fs'
import { readFileSync as readJsonSync } from 'jsonfile'
import { keys } from 'lodash'
import P from 'bluebird'
import Debug from 'debug'

let debug = new Debug('libs-mstorage-restore:exists')

export default function mv(restorePath, richInfo=false) {
  return P.try(() => {
    debug(`restorePath: ${restorePath}`)
    let debugInfo=[]

    if (!existsSync(restorePath)) {
      debugInfo.push({
        path: restorePath,
        type: 'restorePath' })
      debug(`restorePath not exist -> return false\
        \n\t restorePath: ${restorePath}`)
      return richInfo
        ? { exist: false, debugInfo }
        : false
    }

    let restorePlanBase = readJsonSync(restorePath)

    let isVaultPlansExist = restorePlanBase.every(vMeta => {
      let isVaultPlanExist = existsSync(vMeta.restoreVaultPath)
      if (!isVaultPlanExist) {
        debugInfo.push({
          path: vMeta.restoreVaultPath,
          type: 'restoreVaultPath' })
        debug(`vault plan not exist: ${vMeta.restoreVaultPath}`)
      }

      return isVaultPlanExist
    })

    let isKeyDumpsExist = restorePlanBase.every(vMeta => {
      if (!existsSync(vMeta.restoreVaultPath)) return false

      let restoreVaultPlan = readJsonSync(vMeta.restoreVaultPath)
      return keys(restoreVaultPlan)
        .filter(key => /^_/.test(key))
        .every(key => {
          let kMeta = restoreVaultPlan[key]
          let isKeyDumpExist = existsSync(kMeta.restoreKeyPath)
          if (!isKeyDumpExist) {
            debugInfo.push({
              path: kMeta.restoreKeyPath,
              type: 'restoreKeyPath' })
            debug(`key dump not exist: ${kMeta.restoreKeyPath}`)
          }

          return isKeyDumpExist
        })
    })

    let exist = isVaultPlansExist && isKeyDumpsExist
    return richInfo
      ? { exist, debugInfo }
      : exist
  })
}
