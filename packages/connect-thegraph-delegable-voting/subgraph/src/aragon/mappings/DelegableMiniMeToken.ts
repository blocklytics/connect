import { ClaimedTokens as ClaimedTokensEvent, NewCloneToken, Approval } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Transfer as TransferEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { NewCloneToken as NewCloneTokenEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Approval as ApprovalEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { Delegate as DelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { UnDelegate as UnDelegateEvent } from '../../../generated/templates/DelegableMiniMeToken/DelegableMiniMeToken'
import { createUser, createDepartmentMember, createDelegationBalance, isZeroAddress, toAddress, votingPowerPercent, ZERO_BI} from '../helpers'
import { Token, DelegationHistory } from '../../../generated/schema'

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
export function handleDelegate(event: DelegateEvent): void {
    const tokenAddress = event.address.toHex()
    const token = Token.load(tokenAddress)
    const totalSupply = token.totalSupply
    const departmentAddress = toAddress(token.department)
    const from = event.params._owner
    const to = event.params._delegate
    const delegationBalance = createDelegationBalance(from, to)
    const amount = event.params._amount
    const blockNumber = event.block.number
    const logIndex = event.transactionLogIndex
    const balanceHistoryId = from.toHexString() + "-" + to.toHexString() + ":" + blockNumber.toString() + "+" + logIndex.toString()

    createUser(from)
    let fromDepartmentMember = createDepartmentMember(departmentAddress, from)
    fromDepartmentMember.user = from.toHex()
    let fromNewPower = fromDepartmentMember.votingPower.minus(amount)
    fromDepartmentMember.votingPower = fromNewPower
    fromDepartmentMember.votingPowerPercent = votingPowerPercent(fromNewPower, totalSupply)
    let newAmountDelegatedFrom = fromDepartmentMember.currentAmountDelegatedFrom.plus(amount)
    fromDepartmentMember.currentAmountDelegatedFrom = newAmountDelegatedFrom
    fromDepartmentMember.save()

    createUser(to)
    let toDepartmentMember = createDepartmentMember(departmentAddress, to)
    toDepartmentMember.user = to.toHex()
    let toNewPower = toDepartmentMember.votingPower.plus(amount)
    toDepartmentMember.votingPower = toNewPower
    toDepartmentMember.votingPowerPercent = votingPowerPercent(toNewPower, totalSupply)
    let newAmountDelegatedTo = toDepartmentMember.currentAmountDelegatedTo.plus(amount)
    toDepartmentMember.currentAmountDelegatedTo = newAmountDelegatedTo
    toDepartmentMember.save()

    const newDelegationBalance = delegationBalance.currentBalance.plus(amount)
    delegationBalance.currentBalance = newDelegationBalance
    delegationBalance.save()

    const history = new DelegationHistory(balanceHistoryId)
    history.from = from.toHex()
    history.to = to.toHex()
    history.amount = amount
    history.newBalance = newDelegationBalance
    history.blockNumber = blockNumber
    history.transactionLogIndex = logIndex
    history.timestamp = event.block.timestamp
    history.transaction = event.transaction.hash
    history.save()
}
export function handleUnDelegate(event: UnDelegateEvent): void {
    const tokenAddress = event.address.toHex()
    const token = Token.load(tokenAddress)
    const totalSupply = token.totalSupply
    const departmentAddress = toAddress(token.department)
    const from = event.params._owner
    const to = event.params._delegate
    const delegationBalance = createDelegationBalance(from, to)
    const amount = event.params._amount
    const blockNumber = event.block.number
    const logIndex = event.transactionLogIndex
    const balanceHistoryId = from.toHexString() + "-" + to.toHexString() + ":" + blockNumber.toString() + "+" + logIndex.toString()

    createUser(from)
    let fromDepartmentMember = createDepartmentMember(departmentAddress, from)
    fromDepartmentMember.user = from.toHex()
    let fromNewPower = fromDepartmentMember.votingPower.plus(amount)
    fromDepartmentMember.votingPower = fromNewPower
    fromDepartmentMember.votingPowerPercent = votingPowerPercent(fromNewPower, totalSupply)
    let newAmountDelegatedFrom = fromDepartmentMember.currentAmountDelegatedFrom.minus(amount)
    fromDepartmentMember.currentAmountDelegatedFrom = newAmountDelegatedFrom
    fromDepartmentMember.save()

    createUser(to)
    let toDepartmentMember = createDepartmentMember(departmentAddress, to)
    toDepartmentMember.user = to.toHex()
    let toNewPower = toDepartmentMember.votingPower.minus(amount)
    toDepartmentMember.votingPower = toNewPower
    toDepartmentMember.votingPowerPercent = votingPowerPercent(toNewPower, totalSupply)
    let newAmountDelegatedTo = toDepartmentMember.currentAmountDelegatedTo.minus(amount)
    toDepartmentMember.currentAmountDelegatedTo = newAmountDelegatedTo
    toDepartmentMember.save()

    const newDelegationBalance = delegationBalance.currentBalance.minus(amount)
    delegationBalance.currentBalance = newDelegationBalance
    delegationBalance.save()

    const history = new DelegationHistory(balanceHistoryId)
    history.from = from.toHex()
    history.to = to.toHex()
    history.amount = ZERO_BI.minus(amount)
    history.newBalance = newDelegationBalance
    history.blockNumber = blockNumber
    history.transactionLogIndex = logIndex
    history.timestamp = event.block.timestamp
    history.transaction = event.transaction.hash
    history.save()
}