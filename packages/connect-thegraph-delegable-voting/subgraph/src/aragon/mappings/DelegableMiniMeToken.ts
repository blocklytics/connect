import { ClaimedTokens as ClaimedTokensEvent, NewCloneToken, Approval } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Transfer as TransferEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { NewCloneToken as NewCloneTokenEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Approval as ApprovalEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Delegate as DelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { UnDelegate as UnDelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { createUser, createDepartmentMember, isZeroAddress, toAddress, votingPowerPercent} from '../helpers'
import {
    User,
    DepartmentMember,
    Token
  } from '../../../generated/schema'


export function handleClaimedTokens(event: ClaimedTokensEvent): void {}
export function handleTransfer(event: TransferEvent): void {
    const tokenAddress = event.address.toHex()
    const token = Token.load(tokenAddress)
    const departmentAddress = toAddress(token.department)
    const from = event.params._from
    const to = event.params._to
    let totalSupply = token.totalSupply
    const amount = event.params._amount
    if (isZeroAddress(from)) {
        totalSupply = token.totalSupply.plus(amount)
        token.totalSupply = totalSupply
        token.save()
    }

    if (isZeroAddress(to)) {
        totalSupply = token.totalSupply.minus(amount)
        token.totalSupply = totalSupply
        token.save()
    }

    if (!isZeroAddress(from)) {
        createUser(from)
        let fromDepartmentMember = createDepartmentMember(departmentAddress, from)
        fromDepartmentMember.user = from.toHex()
        let newPower = fromDepartmentMember.votingPower.minus(amount)
        fromDepartmentMember.votingPower = newPower
        fromDepartmentMember.votingPowerPercent = votingPowerPercent(newPower, totalSupply)
        let newTokenBalance = fromDepartmentMember.currentTokenBalance.minus(amount)
        fromDepartmentMember.currentTokenBalance = newTokenBalance
        fromDepartmentMember.save()
    } 

    if (!isZeroAddress(to)) {
        createUser(to)
        let toDepartmentMember = createDepartmentMember(departmentAddress, to)
        toDepartmentMember.user = to.toHex()
        let newPower = toDepartmentMember.votingPower.plus(amount)
        toDepartmentMember.votingPower = newPower
        toDepartmentMember.votingPowerPercent = votingPowerPercent(newPower, totalSupply)
        let newTokenBalance = toDepartmentMember.currentTokenBalance.plus(amount)
        toDepartmentMember.currentTokenBalance = newTokenBalance
        toDepartmentMember.save()
    } 
}
export function handleNewCloneToken(event: NewCloneTokenEvent): void {}
export function handleApproval(event: ApprovalEvent): void {}
export function handleDelegate(event: DelegateEvent): void {}
export function handleUnDelegate(event: UnDelegateEvent): void {}