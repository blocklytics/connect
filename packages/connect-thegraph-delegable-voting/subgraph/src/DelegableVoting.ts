import { log, Address, BigInt } from '@graphprotocol/graph-ts'
import {
  StartVote as StartVoteEvent,
  CastVote as CastVoteEvent,
  ExecuteVote as ExecuteVoteEvent,
  ChangeSupportRequired as ChangeSupportRequiredEvent,
  ChangeMinQuorum as ChangeMinQuorumEvent,
  ScriptResult as ScriptResultEvent,
  RecoverToVault as RecoverToVaultEvent,
  DelegableVoting as DelegableVotingContract
} from '../generated/templates/DelegableVoting/DelegableVoting'
import {
  Vote as VoteEntity,
  Cast as CastEntity,
  Department,
  DepartmentMember,
  User
} from '../generated/schema'

import { ONE_BI, ZERO_BI, createDepartmentMember, toAddress, convertToPct } from './aragon/helpers'

export function handleStartVote(event: StartVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  vote.creator = event.params.creator.toHex()
  vote.createdByMember = createDepartmentMember(event.address, event.params.creator).id
  vote.metadata = event.params.metadata

  let voting = DelegableVotingContract.bind(event.address)
  let voteData = voting.getVote(vote.voteNum)
  vote.executed = voteData.value1
  vote.startDate = voteData.value2
  vote.snapshotBlock = voteData.value3
  vote.supportRequiredPct = convertToPct(voteData.value4)
  vote.minAcceptQuorum = convertToPct(voteData.value5)
  vote.yea = voteData.value6
  vote.nay = voteData.value7
  vote.sharesAvailable = voteData.value8
  vote.script = voteData.value9
  vote.org = voting.kernel().toHex()
  vote.department = event.address.toHex()
  let department = Department.load(event.address.toHex())
  let potentialVotingMembers = vote.potentialVotingMembers || []
  let potentialVoters = vote.potentialVoters || []
  let departmentMembers = department.members
  for (let i = 0; i < departmentMembers.length; i ++) {
    let deptMember = DepartmentMember.load(departmentMembers[i])
    if (deptMember.votingPower > ZERO_BI) {
      potentialVotingMembers.push(deptMember.id)
      potentialVoters.push(deptMember.user)
    }
  }
  vote.potentialVoters = potentialVoters
  for (let i = 0; i < potentialVoters.length; i++) {
    let user = User.load(potentialVoters[i])
    let numVotes = user.numPotentialVotes
    numVotes.plus(ONE_BI)
    user.numPotentialVotes = numVotes
    user.save()
  }
  vote.numPotentialVoters = BigInt.fromI32(potentialVoters.length)
  vote.potentialVotingMembers = potentialVotingMembers
  for (let i = 0; i < potentialVotingMembers.length; i++) {
    let member = DepartmentMember.load(potentialVotingMembers[i])
    let numVotes = member.numPotentialVotes
    numVotes.plus(ONE_BI)
    member.numPotentialVotes = numVotes
    member.save()
  }
  vote.createdAtBlockNumber = event.block.number
  vote.createdAtTimestamp = event.block.timestamp
  vote.createdAtTransaction = event.transaction.hash
  vote.save()
}

export function handleCastVote(event: CastVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  let numCasts = vote.numCasts
  let voteYea = vote.yea
  let voteNay = vote.nay
  let voter = event.params.voter.toHex()
  let member = createDepartmentMember(toAddress(vote.department), event.params.voter)

  let castId = _getCastEntityId(vote, numCasts)
  let cast = new CastEntity(castId)

  cast.voter = voter
  cast.member = member.id
  cast.supports = event.params.supports
  cast.voterStake = event.params.stake
  cast.voteNum = vote.voteNum
  cast.vote = vote.id
  cast.org = vote.org
  cast.department = vote.department
  cast.castAtBlockNumber = event.block.number
  cast.castAtTimestamp = event.block.timestamp
  cast.castAtTransaction = event.transaction.hash

  let voteCasts = vote.casts
  voteCasts.push(castId)
  vote.casts = voteCasts
  vote.numCasts = numCasts.plus(ONE_BI)
  let voters = vote.voters
  let votingMembers = vote.votingMembers

  if (!voters.includes(voter)) {
    let sharesUsed = vote.sharesUsed
    vote.sharesUsed = sharesUsed.plus(event.params.stake)
  
    let numVoters = vote.numVoters
    vote.numVoters = numVoters.plus(ONE_BI)
    
    voters.push(voter)
    vote.voters = voters
    
    votingMembers.push(member.id)
    vote.votingMembers = votingMembers
    
    if (event.params.supports == true) {
      vote.yea = voteYea.plus(event.params.stake)
    } else {
      vote.nay = voteNay.plus(event.params.stake)
    }
  } else {
    if (event.params.supports == true) {
      vote.yea = voteYea.plus(event.params.stake)
      vote.nay = voteNay.minus(event.params.stake)
    } else {
      vote.nay = voteNay.plus(event.params.stake)
      vote.yea = voteYea.minus(event.params.stake)
    }
  }

  vote.save()
  cast.save()
}

export function handleExecuteVote(event: ExecuteVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  vote.executed = true
  vote.executedAtBlockNumber = event.block.number
  vote.executedAtTimestamp = event.block.timestamp
  vote.executedAtTransaction = event.transaction.hash
  if (vote.numPotentialVoters != ZERO_BI) {
    vote.voterParticipationPct = vote.numVoters.toBigDecimal().div(vote.numPotentialVoters.toBigDecimal())
  } else {
    log.debug("Div by zero npv", [])
  }
  if (vote.sharesAvailable != ZERO_BI) {
    vote.shareUsagePct = vote.sharesUsed.toBigDecimal().div(vote.sharesAvailable.toBigDecimal())
  } else {
    log.debug("Div by zero vp", [])
  }

  let participatingVoters = vote.voters
  for (let i = 0; i < participatingVoters.length; i++) {
    let user = User.load(participatingVoters[i])
    let numVotes = user.numVotesParticipated
    numVotes.plus(ONE_BI)
    user.numVotesParticipated = numVotes
    if (user.numPotentialVotes != ZERO_BI) {
      user.voteParticipationPct = numVotes.toBigDecimal().div(user.numPotentialVotes.toBigDecimal())
    } else {
      log.debug("Div by zero user nvp: {}", [user.id])
    }
    user.save()
  }

  let participatingMembers = vote.votingMembers
  for (let i = 0; i < participatingMembers.length; i++) {
    let member = DepartmentMember.load(participatingMembers[i])
    let numVotes = member.numVotesParticipated
    numVotes.plus(ONE_BI)
    member.numVotesParticipated = numVotes
    if (member.numPotentialVotes != ZERO_BI) {
      member.voteParticipationPct = numVotes.toBigDecimal().div(member.numPotentialVotes.toBigDecimal())
    } else {
      log.debug("Div by zero member nvp: {}", [member.id])
    }
    member.save()
  }

  vote.save()
}

function _getVoteEntity(appAddress: Address, voteNum: BigInt): VoteEntity {
  let voteEntityId = _getVoteEntityId(appAddress, voteNum)

  let vote = VoteEntity.load(voteEntityId)
  if (vote === null) {
    vote = new VoteEntity(voteEntityId)
    vote.voteNum = voteNum
    vote.executed = false
    vote.numCasts = ZERO_BI
    vote.numVoters = ZERO_BI
    vote.casts = []
    vote.voters = []
    vote.votingMembers = []
    vote.potentialVoters = []
    vote.potentialVotingMembers = []
  }

  return vote as VoteEntity
}

function _getCastEntityId(vote: VoteEntity, numCast: BigInt): string {
  return vote.id + '-castNum:' + numCast.toString()
}

function _getVoteEntityId(appAddress: Address, voteNum: BigInt): string {
  return 'appAddress:' + appAddress.toHexString() + '-voteId:' + voteNum.toHexString()
}