import { Address, DataSourceTemplate, log, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { AragonInfo as AragonInfoEntity } from '../../generated/schema'
import { Kernel as KernelTemplate } from '../../generated/templates'
import * as hooks from '../aragon-hooks'

export function processOrg(
  orgAddress: Address, 
  blockNumber: BigInt, 
  blockTimestamp: BigInt, 
  transaction: Bytes
): void {
  if (!_isRegistered(orgAddress, 'org')) {
    KernelTemplate.create(orgAddress)
    hooks.onOrgTemplateCreated(
      orgAddress,
      blockNumber, 
      blockTimestamp, 
      transaction
    )

    _registerEntity(orgAddress, 'org')
  }
}

export function processDepartment(
  orgAddress: Address,
  deptAddress: Address,
  tokenManagerAddress: Address,
  tokenAddress: Address,
  isMgmt: boolean,
  blockNumber: BigInt, 
  blockTimestamp: BigInt, 
  transaction: Bytes
): void {
  if (!_isRegistered(deptAddress, 'app')) {
      DataSourceTemplate.create('DelegableVoting', [deptAddress.toHexString()])
      hooks.onDeptTemplateCreated(
        orgAddress, 
        deptAddress, 
        tokenManagerAddress, 
        tokenAddress, 
        isMgmt,
        blockNumber, 
        blockTimestamp, 
        transaction
      )

    _registerEntity(deptAddress, 'app')
  }
  processApp(tokenManagerAddress, '0x612a0e063dccdc5e9b8980e4f084f2831ce5ccd6f9aaf90da5811a18da11f0c2')
  processToken(tokenAddress)
}

export function processApp(appAddress: Address, appId: string): void {
  if (!_isRegistered(appAddress, 'app')) {
    let templateType = hooks.getTemplateForApp(appId)
    if (templateType) {
      DataSourceTemplate.create(templateType, [appAddress.toHexString()])
      hooks.onAppTemplateCreated(appAddress, appId)
    }

    _registerEntity(appAddress, 'app')
  }
}

export function processToken(tokenAddress: Address): void {
  if (!_isRegistered(tokenAddress, 'token')) {
    _registerEntity(tokenAddress, 'token')
  }
}

function _isRegistered(address: Address, type: string): boolean {
  let aragon = _getAragonInfo()

  let entities: Address[]
  if (type == 'org') {
    entities = aragon.orgs as Address[]
  } else if (type == 'app') {
    entities = aragon.apps as Address[]
  } else if (type == 'token') {
    entities = aragon.tokens as Address[]
  } else {
    throw new Error('Invalid entity type ' + type)
  }

  return entities.includes(address)
}

function _registerEntity(address: Address, type: string): void {
  let aragon = _getAragonInfo()

  if (type == 'org') {
    let entities = aragon.orgs
    entities.push(address)
    aragon.orgs = entities
  } else if (type == 'app') {
    let entities = aragon.apps
    entities.push(address)
    aragon.apps = entities
  } else if (type == 'token') {
    let entities = aragon.tokens
    entities.push(address)
    aragon.tokens = entities
  } else {
    throw new Error('Invalid entity type ' + type)
  }

  aragon.save()
}

function _getAragonInfo(): AragonInfoEntity {
  let aragonId = 'THERE_CAN_ONLY_BE_ONE'

  let aragon = AragonInfoEntity.load(aragonId)
  if (!aragon) {
    aragon = new AragonInfoEntity(aragonId)

    aragon.orgs = []
    aragon.apps = []
    aragon.tokens = []

    aragon.save()
  }

  return aragon!
}
