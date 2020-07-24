import { log, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { LiquidDemocracy, User, DepartmentMember, Department, Token } from '../../generated/schema'
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
  // bind to the exchange address
  const contract = DelegableMiniMeToken.bind(tokenAddress)

  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (!symbolResult.reverted) {
    symbolValue = symbolResult.value
  }
  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  // bind to the exchange address
  const contract = DelegableMiniMeToken.bind(tokenAddress)

  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (!nameResult.reverted) {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  const contract = DelegableMiniMeToken.bind(tokenAddress)
  let decimalValue = null
  const decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue
}

export function createLiquidDemocracy(orgAddress: Address): LiquidDemocracy {
  let ld = LiquidDemocracy.load(orgAddress.toHexString())
  if (ld === null) {
    ld = new LiquidDemocracy(orgAddress.toHexString())
    ld.save()
  }
  if (ld == null) log.error("LiquidDemocracy is null", [orgAddress.toHexString()])
  return ld as LiquidDemocracy
}

export function createDepartment(appAddress: Address): Department {
  let department = Department.load(appAddress.toHexString())
  if (department === null) {
    department = new Department(appAddress.toHexString())
    const deptContract = DelegableVoting.bind(appAddress)
    const deptTokenAddress = deptContract.token()
    const token = Token.load(deptTokenAddress.toHex())
    department.save()
  }
  if (department == null) log.error("Department is null", [appAddress.toHexString()])
  return department as Department
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
  if (departmentMember == null) log.error("DepartmentMember is null", [id])
  return departmentMember as DepartmentMember
}

export function votingPowerPercent(votingPower: BigInt, totalSupply: BigInt): BigDecimal {
  return BigDecimal.fromString(votingPower.toString()).div(BigDecimal.fromString(totalSupply.toString()))
}

export function createUser(address: Address): void {
  let user = User.load(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
    user.save()
  }
}

export function oneBigInt(): BigInt {
  return BigInt.fromI32(1)
}
