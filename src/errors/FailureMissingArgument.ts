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
 * @class FailureMissingArgument
 * @package Governable
 * @subpackage Errors
 * @since v1.0.0
 * @description The execution context is missing a required argument.
 */
export class FailureMissingArgument extends FailureContractExecution {}
