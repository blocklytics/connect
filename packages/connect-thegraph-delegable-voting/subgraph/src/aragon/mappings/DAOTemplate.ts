import { log } from '@graphprotocol/graph-ts'
import { DeployDao as DeployDaoEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DAOTemplate'
import { SetupDao as SetupDaoEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DAOTemplate'
import { DeployToken as DeployTokenEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DAOTemplate'
import { InstalledApp as InstalledAppEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DAOTemplate'
import { DepartmentCreated as DepartmentCreatedEvent } from '../../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DAOTemplate'
import * as aragon from '../aragon'

export function handleDeployDao(event: DeployDaoEvent): void {
  log.debug("Creating org: {}", [event.params.dao.toHexString()])
  aragon.processOrg(event.params.dao, event.block.number, event.block.timestamp, event.transaction.hash)
}

export function handleDepartmentCreated(event: DepartmentCreatedEvent): void {
  log.debug("Adding department: {}", [event.params.department.toHexString()])
  aragon.processDepartment(
    event.params.org, 
    event.params.department, 
    event.params.tokenManager, 
    event.params.token, 
    event.params.isMgmt,
    event.block.number, 
    event.block.timestamp, 
    event.transaction.hash
  )
}

export function handleInstalledApp(event: InstalledAppEvent): void {
  // log.debug("Adding app: {}", [event.params.appProxy.toHexString()])
  // aragon.processApp(event.params.appProxy, event.params.appId.toHexString())
}

export function handleDeployToken(event: DeployTokenEvent): void {
  // log.debug("Adding token: {}", [event.params.token.toHexString()])
  // aragon.processToken(event.params.token)
}

export function handleSetupDao(event: SetupDaoEvent): void {}
