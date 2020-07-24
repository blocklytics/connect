import { Address, BigInt } from '@graphprotocol/graph-ts'
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
  Cast as CastEntity
} from '../generated/schema'

import { ONE_BI, ZERO_BI } from './aragon/helpers'

export function handleStartVote(event: StartVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  _populateVoteDataFromEvent(vote, event)
  _populateVoteDataFromContract(vote, event.address, vote.voteNum)

  vote.save()
}

export function handleCastVote(event: CastVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  let numCasts = vote.numCasts

  let castId = _getCastEntityId(vote, numCasts)
  let cast = new CastEntity(castId)

  _populateCastDataFromEvent(cast, event)
  cast.voteNum = vote.voteNum
  cast.vote = vote.id

  if (event.params.supports == true) {
    vote.yea = vote.yea.plus(event.params.stake)
  } else {
    vote.nay = vote.nay.plus(event.params.stake)
  }

  vote.numCasts = numCasts.plus(ONE_BI)

  vote.save()
  cast.save()
}

export function handleExecuteVote(event: ExecuteVoteEvent): void {
  let vote = _getVoteEntity(event.address, event.params.voteId)

  vote.executed = true

  vote.save()
}

function _getVoteEntity(appAddress: Address, voteNum: BigInt): VoteEntity {
  let voteEntityId = _getVoteEntityId(appAddress, voteNum)

  let vote = VoteEntity.load(voteEntityId)
  if (!vote) {
    vote = new VoteEntity(voteEntityId)

    vote.voteNum = voteNum
    vote.executed = false
    vote.numCasts = ZERO_BI
  }

  return vote!
}

function _getCastEntityId(vote: VoteEntity, numCast: BigInt): string {
  return vote.id + '-castNum:' + numCast.toString()
}

function _getVoteEntityId(appAddress: Address, voteNum: BigInt): string {
  return 'appAddress:' + appAddress.toHexString() + '-voteId:' + voteNum.toHexString()
}

function _populateVoteDataFromContract(vote: VoteEntity, appAddress: Address, voteNum: BigInt): void {
  let voting = DelegableVotingContract.bind(appAddress)

  let voteData = voting.getVote(voteNum)

  vote.executed = voteData.value1
  vote.startDate = voteData.value2
  vote.snapshotBlock = voteData.value3
  vote.supportRequiredPct = voteData.value4
  vote.minAcceptQuorum = voteData.value5
  vote.yea = voteData.value6
  vote.nay = voteData.value7
  vote.votingPower = voteData.value8
  vote.script = voteData.value9
  vote.org = voting.kernel().toHex()
  vote.department = appAddress.toHex()
}

function _populateVoteDataFromEvent(vote: VoteEntity, event: StartVoteEvent): void {
  vote.creator = event.address.toHexString() + "-" + event.params.creator.toHex()
  vote.metadata = event.params.metadata
}

function _populateCastDataFromEvent(cast: CastEntity, event: CastVoteEvent): void {
  cast.voter = event.params.voter.toHex()
  cast.supports = event.params.supports
  cast.voterStake = event.params.stake
}
