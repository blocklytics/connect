import { log } from '@graphprotocol/graph-ts'
import { DeployDao as DeployDaoEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DAOTemplate'
import { SetupDao as SetupDaoEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DAOTemplate'
import { DeployToken as DeployTokenEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DAOTemplate'
import { InstalledApp as InstalledAppEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DAOTemplate'
import * as aragon from '../aragon'

export function handleDeployDao(event: DeployDaoEvent): void {
  log.debug("Creating org: ", [event.params.dao.toHex()])
  aragon.processOrg(event.params.dao)
}

export function handleInstalledApp(event: InstalledAppEvent): void {
  log.debug("Adding app: ", [event.params.appProxy.toHex()])
  aragon.processApp(event.params.appProxy, event.params.appId.toHexString())
}

export function handleDeployToken(event: DeployTokenEvent): void {
  log.debug("Adding token: ", [event.params.token.toHex()])
  aragon.processToken(event.params.token)
}

export function handleSetupDao(event: SetupDaoEvent): void {}
