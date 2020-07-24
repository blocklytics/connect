import { log, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { LiquidDemocracy, User, DepartmentMember, Department, Token, DelegationBalance } from '../../generated/schema'
import { DelegableMiniMeToken } from '../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DelegableMiniMeToken'
import { DelegableVoting } from '../../generated/liquid-democracy-template.open.aragonpm.eth@17.0.0/DelegableVoting'

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

export function toAddress(input: string): Address {
  return Address.fromString(input)
}

export function isZeroAddress(input: Address): boolean {
  return input == toAddress(ZERO_ADDRESS)
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
  let decimalValue = null
  const decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue as BigInt
}

export function createLiquidDemocracy(orgAddress: Address): void {
  let ld = LiquidDemocracy.load(orgAddress.toHexString())
  if (ld === null) {
    ld = new LiquidDemocracy(orgAddress.toHexString())
    ld.save()
  }
  if (ld == null) {
    log.error("LiquidDemocracy is null", [orgAddress.toHexString()])
  } else {
    log.debug("Created LiquidDemocracy: ", [orgAddress.toHex()])
  }
}

export function createDepartment(appAddress: Address, appId: string): void {
  let department = Department.load(appAddress.toHexString())
  if (department === null) {
    department = new Department(appAddress.toHexString())
    const deptContract = DelegableVoting.bind(appAddress)
    const deptTokenAddress = deptContract.token()
    department.token = deptTokenAddress.toHex()
    let token = Token.load(deptTokenAddress.toHex())
    const tokenName = fetchTokenName(deptTokenAddress)
    if (token === null) {
      token = new Token(deptTokenAddress.toHex())
      token.name = tokenName
      token.symbol = fetchTokenSymbol(deptTokenAddress)
      token.decimals = fetchTokenDecimals(deptTokenAddress)
      token.totalSupply = ZERO_BI
      token.save()
    }
    department.org = deptContract.kernel().toHex()
    department.name = tokenName
    department.appId = appId
    department.supportRequiredPct = deptContract.supportRequiredPct()
    department.minAcceptQuorum = deptContract.minAcceptQuorumPct()
    department.voteDuration = deptContract.voteTime()
    department.save()
  }
  if (department == null) {
    log.error("Department is null", [appAddress.toHexString()])
  } else {
    log.debug("Created Department: ", [appAddress.toHex()])
  }

}

export function createToken(tokenAddress: Address): void {
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
    log.error("Token is null", [tokenAddress.toHexString()])
  } else {
    log.debug("Created Token: ", [tokenAddress.toHex()])
  }
}

export function createDepartmentMember(department: Address, user: Address): DepartmentMember {
  const id = department.toHexString().concat('-').concat(user.toHexString())
  let departmentMember = DepartmentMember.load(id)
  if (departmentMember === null) {
    departmentMember = new DepartmentMember(id)
    departmentMember.user = user.toHexString()
    departmentMember.department = department.toHexString()
    departmentMember.votingPower = ZERO_BI
    departmentMember.votingPowerPercent = ZERO_BD
    departmentMember.currentTokenBalance = ZERO_BI
    departmentMember.currentAmountDelegatedFrom = ZERO_BI
    departmentMember.currentAmountDelegatedTo = ZERO_BI
    departmentMember.save()
  }
  if (departmentMember == null) {
    log.error("DepartmentMember is null", [id])
  } else {
    log.debug("Created DepartmentMember: ", [id])
  }
  return departmentMember as DepartmentMember
}

export function createUser(address: Address): void {
  let user = User.load(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
    user.save()
  }
  if (user == null) {
    log.error("User is null", [address.toHex()])
  } else {
    log.debug("Created User: ", [address.toHex()])
  }
}

export function createDelegationBalance(from: Address, to: Address): DelegationBalance {
  const id = from.toHexString() + "-" + to.toHexString()
  let balance = DelegationBalance.load(id)
  if (balance === null) {
    balance = new DelegationBalance(id)
    balance.from = from.toHexString()
    balance.to = to.toHexString()
    balance.currentBalance = ZERO_BI
    balance.save()
  }
  if (balance == null) {
    log.error("DelegationBalance is null", [id])
  } else {
    log.debug("Created DelegationBalance: ", [id])
  }
  return balance as DelegationBalance
}

export function votingPowerPercent(votingPower: BigInt, totalSupply: BigInt): BigDecimal {
  return BigDecimal.fromString(votingPower.toString()).div(BigDecimal.fromString(totalSupply.toString()))
}

export function oneBigInt(): BigInt {
  return BigInt.fromI32(1)
}
