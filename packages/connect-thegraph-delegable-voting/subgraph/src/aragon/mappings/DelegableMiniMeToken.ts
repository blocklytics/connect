import { ClaimedTokens as ClaimedTokensEvent, NewCloneToken, Approval } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Transfer as TransferEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { NewCloneToken as NewCloneTokenEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Approval as ApprovalEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Delegate as DelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { UnDelegate as UnDelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'

export function handleClaimedTokens(event: ClaimedTokensEvent): void {}
export function handleTransfer(event: TransferEvent): void {}
export function handleNewCloneToken(event: NewCloneTokenEvent): void {}
export function handleApproval(event: ApprovalEvent): void {}
export function handleDelegate(event: DelegateEvent): void {}
export function handleUnDelegate(event: UnDelegateEvent): void {}