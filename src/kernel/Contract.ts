/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

import { PublicAccount, Transaction } from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import {
  AllowanceResult,
  ContractOption,
  Context,
} from '../../index'

/**
 * @interface Contract
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Interface that describes digital contracts.
 */
export interface Contract {
  /**
   * @description The contract name
   */
  readonly name: string

  /**
   * @description The contract execution context
   */
  readonly context: Context

  /**
   * @description The contract on-chain descriptor
   */
  readonly descriptor: string

  /**
   * Verifies **allowance** of `actor` to execute contract. Arguments to
   * the contract execution can be passed in `argv`.
   *
   * @param   {PublicAccount}           actor
   * @param   {Array<ContractOption>}    argv
   * @return  {AllowanceResult}
   **/
  canExecute(
    actor: PublicAccount,
    argv: ContractOption[] | undefined,
  ): AllowanceResult

  /**
   * Execute the contract with `actor` operator account. Arguments to
   * the contract execution can be passed in `argv`.
   *
   * @param   {PublicAccount}           actor
   * @param   {Array<ContractOption>}    argv
   * @return  {TransactionURI}
   **/
  execute(
    actor: PublicAccount,
    argv: ContractOption[] | undefined,
  ): TransactionURI<Transaction>
}
