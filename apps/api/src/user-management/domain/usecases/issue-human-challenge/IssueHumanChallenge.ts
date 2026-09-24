import { Either } from 'effect/index';

import { UseCase } from '../../../../shared/use-case/UseCase';
import { HumanChallenge, HumanProof } from '../../ports/HumanProof';

interface Props {
  now: Date;
}

export class IssueHumanChallenge implements UseCase<
  Props,
  Promise<Either.Either<HumanChallenge, never>>
> {
  constructor(private readonly humanProof: HumanProof) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<HumanChallenge, never>> {
    return Either.right(this.humanProof.issueChallenge(props.now));
  }
}
