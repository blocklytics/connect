import { Address } from '@graphprotocol/graph-ts'
import { createLiquidDemocracy, createDepartment, createToken } from './aragon/helpers'

/*
 * Called when an app proxy is detected.
 *
 * Return the name of a data source template if you would like to create it for a given appId.
 * Return null otherwise.
 *
 * The returned name is used to instantiate a template declared in the subgraph manifest file,
 * which must have the same name.
 */
export function getTemplateForApp(appId: string): string | null {
  if (appId == '0x962d75a3fcdae15ddc7ef4fe1d96f9af72169958e9bc683aedfee5f32e7c84a5') {
    return 'DelegableVoting'
  } else {
    return null
  }
}

export function onOrgTemplateCreated(orgAddress: Address): void {
  createLiquidDemocracy(orgAddress)
}
export function onAppTemplateCreated(appAddress: Address, appId: string): void {
  createDepartment(appAddress, appId) 
}
export function onTokenTemplateCreated(tokenAddress: Address): void {
  createToken(tokenAddress)
}
