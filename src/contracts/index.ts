/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import { CreateAgreement as CreateAgreementImpl } from './CreateAgreement'
import { CommitAgreement as CommitAgreementImpl } from './CommitAgreement'
import { CreateDAO as CreateDAOImpl } from './CreateDAO'
import { CreateVote as CreateVoteImpl } from './CreateVote'
import { Vote as VoteImpl } from './Vote'

/**
 * @namespace Governable.DAOContracts
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Namespace that contains digital contract implementations
 */
export namespace DAOContracts {

  // - Exports an alias to the `CreateAgreement` contract implementation
  export class CreateAgreement extends CreateAgreementImpl {}

  // - Exports an alias to the `CommitAgreement` contract implementation
  export class CommitAgreement extends CommitAgreementImpl {}

  // - Exports an alias to the `CreateDAO` contract implementation
  export class CreateDAO extends CreateDAOImpl {}

  // - Exports an alias to the `CreateVote` contract implementation
  export class CreateVote extends CreateVoteImpl {}

  // - Exports an alias to the `Vote` contract implementation
  export class Vote extends VoteImpl {}

}
