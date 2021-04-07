/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

// internal dependencies
import { FailureContractExecution } from './FailureContractExecution'

/**
 * @class FailureInvalidContract
 * @package Governable
 * @subpackage Errors
 * @since v1.0.0
 * @description The contract does not refer to a valid contract.
 */
export class FailureInvalidContract extends FailureContractExecution {}
