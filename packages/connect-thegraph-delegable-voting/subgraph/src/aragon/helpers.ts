import { log, BigInt, BigDecimal, Address, Bytes } from '@graphprotocol/graph-ts'
import { LiquidDemocracy, User, DepartmentMember, Department, TokenManager, Token, DelegationBalance } from '../../generated/schema'
import { DelegableMiniMeToken } from '../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DelegableMiniMeToken'
import { DelegableVoting } from '../../generated/liquid-democracy-template.open.aragonpm.eth@18.0.0/DelegableVoting'
import { DelegableMiniMeToken as DelegableMiniMeTokenTemplate } from '../../generated/templates'


/************************************
 ********** Helpers ***********
 ************************************/

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export const ZERO_BD = BigDecimal.fromString('0')

export const ZERO_BI = BigInt.fromI32(0)

export const ONE_BI = BigInt.fromI32(1)

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export class KnownOrg {
  address: string
  name: string
}
export const KNOWN_ORGS: Array<KnownOrg> = [
  {
    address: "0x6440fcb29dc25b184420001bfd64fdb0ce4f73b0", 
    name: "Liquid America"
  },
  {
    address: "0xc6daee7d40b5b63ef85b1deb1149585e03e138f2",
    name: "Liquid Compound"
  }
]

export function toAddress(input: string): Address {
  return Address.fromString(input)
}

export function isZeroAddress(input: Address): boolean {
  return input == toAddress(ZERO_ADDRESS)
}

export function convertToPct(number: BigInt): BigDecimal {
  return number.toBigDecimal().div(bigDecimalExp18())
}

export function convertTokenToDecimal(tokenAmount: BigInt, tokenDecimals: i32): BigDecimal {
  if (tokenDecimals == 0) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(tokenDecimals))
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString())
  const zero = parseFloat(ZERO_BD.toString())
  if (zero == formattedVal) {
    return true
  }
  return false
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  const contract = DelegableMiniMeToken.bind(tokenAddress)

  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (!symbolResult.reverted) {
    symbolValue = symbolResult.value
  }
  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  const contract = DelegableMiniMeToken.bind(tokenAddress)

  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (!nameResult.reverted) {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  const contract = DelegableMiniMeToken.bind(tokenAddress)
  let decimalValue = contract.decimals()
  return BigInt.fromI32(decimalValue)
}

export function createLiquidDemocracy(
  orgAddress: Address,
  blockNumber: BigInt, 
  blockTimestamp: BigInt, 
  transaction: Bytes
): void {
  let ld = LiquidDemocracy.load(orgAddress.toHexString())
  if (ld === null) {
    ld = new LiquidDemocracy(orgAddress.toHexString())
    let orgName = orgAddress.toHexString()
    for (let i = 0; i < KNOWN_ORGS.length; i++) {
      if (KNOWN_ORGS[i].address == orgName) {
        orgName = KNOWN_ORGS[i].name
        break
      }
    }
    ld.name = orgName
    ld.createdAtBlockNumber = blockNumber
    ld.createdAtTimestamp = blockTimestamp
    ld.createdAtTransaction = transaction
    ld.save()
  }
  if (ld == null) {
    log.error("LiquidDemocracy is null: {}", [orgAddress.toHexString()])
  } else {
    log.debug("Created LiquidDemocracy: {}", [orgAddress.toHexString()])
  }
}

export function createDepartment(
  orgAddress: Address, 
  appAddress: Address,
  tokenManagerAddress: Address,
  deptTokenAddress: Address, 
  isMgmt: boolean,
  blockNumber: BigInt, 
  blockTimestamp: BigInt, 
  transaction: Bytes
): void {
  let token = Token.load(deptTokenAddress.toHex())
  const tokenName = fetchTokenName(deptTokenAddress)
  if (token === null) {
    DelegableMiniMeTokenTemplate.create(deptTokenAddress)
    token = new Token(deptTokenAddress.toHex())
    token.name = tokenName
    token.symbol = fetchTokenSymbol(deptTokenAddress)
    token.decimals = fetchTokenDecimals(deptTokenAddress)
    token.totalSupply = ZERO_BI
    token.department = appAddress.toHex()
    token.org = orgAddress.toHex()
    token.save()
  }

  let tokenManager = new TokenManager(tokenManagerAddress.toHex())
  tokenManager.appId = "0x612a0e063dccdc5e9b8980e4f084f2831ce5ccd6f9aaf90da5811a18da11f0c2"
  tokenManager.department = appAddress.toHex()
  tokenManager.org = orgAddress.toHex()
  tokenManager.token = deptTokenAddress.toHex()
  tokenManager.createdAtBlockNumber = blockNumber
  tokenManager.createdAtTimestamp = blockTimestamp
  tokenManager.createdAtTransaction = transaction
  tokenManager.save()

  let department = Department.load(appAddress.toHex())
  if (department === null) {
    department = new Department(appAddress.toHex())
    department.token = deptTokenAddress.toHex()
    department.org = orgAddress.toHex()
    department.name = tokenName
    department.appId = "0x962d75a3fcdae15ddc7ef4fe1d96f9af72169958e9bc683aedfee5f32e7c84a5"
    const deptContract = DelegableVoting.bind(appAddress)
    department.supportRequiredPct = convertToPct(deptContract.supportRequiredPct())
    department.minAcceptQuorum = convertToPct(deptContract.minAcceptQuorumPct())
    department.voteDuration = deptContract.voteTime()
    department.isManagement = isMgmt
    department.createdAtBlockNumber = blockNumber
    department.createdAtTimestamp = blockTimestamp
    department.createdAtTransaction = transaction
    department.members = []
    department.save()
  }

  if (department == null) {
    log.error("Department is null: {}", [appAddress.toHexString()])
  } else {
    log.debug("Created Department: {}", [appAddress.toHexString()])
  }

}

export function createToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHex())
  if (token === null) {
    token = new Token(tokenAddress.toHex())
    token.name = fetchTokenName(tokenAddress)
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.decimals = fetchTokenDecimals(tokenAddress)
    token.totalSupply = ZERO_BI
    token.save()
  }
  if (token == null) {
    log.error("Token is null: {}", [tokenAddress.toHexString()])
  } else {
    log.debug("Created Token: {}", [tokenAddress.toHexString()])
    return token
  }
}

export function createDepartmentMember(departmentAddress: Address, userAddress: Address): DepartmentMember {
  const id = departmentAddress.toHexString().concat('-').concat(userAddress.toHexString())
  let departmentMember = DepartmentMember.load(id)
  if (departmentMember === null) {
    departmentMember = new DepartmentMember(id)
    departmentMember.user = userAddress.toHexString()
    departmentMember.department = departmentAddress.toHexString()
    departmentMember.delegableBalance = ZERO_BI
    departmentMember.votingPower = ZERO_BI
    departmentMember.votingPowerPercent = ZERO_BD
    departmentMember.currentTokenBalance = ZERO_BI
    departmentMember.currentAmountDelegatedFrom = ZERO_BI
    departmentMember.currentAmountDelegatedTo = ZERO_BI
    departmentMember.numVotesParticipated = ZERO_BI
    departmentMember.numPotentialVotes = ZERO_BI
    departmentMember.voteParticipationPct = ZERO_BD
    departmentMember.save()

    let department = Department.load(departmentAddress.toHex())
    let deptMembers = department.members
    deptMembers.push(id)
    department.members = deptMembers
    let user = createUser(userAddress)
    let userOrgs = user.orgs
    if (!userOrgs.includes(userAddress.toHex())) {
      userOrgs.push(department.org)
      user.orgs = userOrgs
    }

    let userDepartments = user.departments
    if (!userDepartments.includes(departmentAddress.toHex())) {
      userDepartments.push(departmentAddress.toHex())
      user.departments = userDepartments
    }
    user.save()
    department.save()
  }
  if (departmentMember == null) {
    log.error("DepartmentMember is null: {}", [id])
  } else {
    log.debug("Created DepartmentMember: {}", [id])
  }
  return departmentMember as DepartmentMember
}

export function createUser(address: Address): User {
  let user = User.load(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
    user.orgs = []
    user.departments = []
    user.numVotesParticipated = ZERO_BI
    user.numPotentialVotes = ZERO_BI
    user.voteParticipationPct = ZERO_BD
    user.save()
  }
  if (user == null) {
    log.error("User is null: {}", [address.toHexString()])
  } else {
    log.debug("Created User: {}", [address.toHexString()])
  }
  return user as User
}

export function createDelegationBalance(department: Address, from: Address, to: Address): DelegationBalance {
  const id = department.toHexString() + "-" + from.toHexString() + "-" + to.toHexString()
  let balance = DelegationBalance.load(id)
  if (balance === null) {
    balance = new DelegationBalance(id)
    balance.department = department.toHex()
    balance.fromUser = from.toHexString()
    balance.toUser = to.toHexString()
    balance.fromMember = createDepartmentMember(department, from).id
    balance.toMember = createDepartmentMember(department, to).id
    balance.currentBalance = ZERO_BI
    balance.save()
  }
  if (balance == null) {
    log.error("DelegationBalance is null: {}", [id])
  } else {
    log.debug("Created DelegationBalance: {}", [id])
  }
  return balance as DelegationBalance
}

export function votingPowerPercent(votingPower: BigInt, totalSupply: BigInt): BigDecimal {
  return BigDecimal.fromString(votingPower.toString()).div(BigDecimal.fromString(totalSupply.toString()))
}

export function updateAllVotingPowerPercent(departmentAddress: Address): void {
  const department = Department.load(departmentAddress.toHex())
  const deptMembers = department.members
  const deptToken = Token.load(department.token)
  for (let i = 0; i < deptMembers.length; i++) {
    const deptMember = DepartmentMember.load(deptMembers[i])
    deptMember.votingPowerPercent = votingPowerPercent(deptMember.votingPower, deptToken.totalSupply)
    deptMember.save()
  }
}