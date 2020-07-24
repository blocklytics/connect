import { NewFactoryCloneToken as NewFactoryCloneTokenEvent } from '../../../generated/DelegableMiniMeTokenFactory@0.0.1/DelegableMiniMeTokenFactory'
import * as aragon from '../aragon'

export function handleClaimedTokens(event: NewFactoryCloneTokenEvent): void {
  aragon.processToken(event.params.token)
}
