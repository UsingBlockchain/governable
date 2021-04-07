/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

import {
  AggregateTransaction,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import {
  AllowanceResult,
  Contract,
  ContractOption,
  Context,
  FailureOperationForbidden,
  FailureMissingArgument,
} from '../../index'

/**
 * @class BaseContract
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Abstract class that describes executable contracts
 *              that involve *governable* digital assets.
 */
export abstract class BaseContract implements Contract {
  /**
   * Construct a contract object around `context`.
   *
   * @param {Context} context 
   */
  public constructor(
    /**
     * @description Execution context
     */
    public readonly context: Context,
  ) {}

  /// region abstract methods
  /**
   * Getter for the contract name.
   *
   * @return {string}
   **/
  public abstract get name(): string

  /**
   * Getter for the contract descriptor.
   *
   * @return {string}
   **/
  public abstract get descriptor(): string

  /**
   * Verifies **allowance** of `actor` to execute contract. Arguments to
   * the contract execution can be passed in `argv`.
   *
   * @param   {PublicAccount}                actor
   * @param   {Array<ContractOption>}   argv
   * @return  {AllowanceResult}
   **/
  public abstract canExecute(
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
  public abstract execute(
    actor: PublicAccount,
    argv: ContractOption[] | undefined,
  ): TransactionURI<Transaction>

  /**
   * Prepare the contract's transactions. Some contracts may require
   * the atomic execution of all their transactions and therefor
   * need the prepare method to wrap transactions inside an aggregate
   * transaction.
   *
   * @param   {PublicAccount}         actor
   * @param   {Array<ContractOption>}   argv
   * @return  {TransactionURI}
   **/
  protected abstract prepare(): AggregateTransaction | Transaction

  /**
   * Build a contract's transactions. Transactions returned here will
   * be formatted to a transaction URI in the `execute()` step.
   *
   * @return {Transaction}
   **/
  protected abstract get transactions(): Transaction[]
  /// end-region abstract methods

  /**
   * Asserts the allowance of `actor` to execute the contract.
   *
   * @param {PublicAccount} actor 
   * @param {ContractOption[]} argv 
   * @throws {FailureOperationForbidden} On denial of authorization
   */
  protected assertExecutionAllowance(
    actor: PublicAccount,
    argv: ContractOption[] | undefined,
  ): boolean {
    // check that `actor` is allowed to execute
    const authResult = this.canExecute(actor, argv)
    if (!authResult.status) {
      throw new FailureOperationForbidden('Operation forbidden (' + this.name + ')')
    }

    return true
  }

  /**
   * Asserts the presence of `fields` in `argv`.
   *
   * @param {ContractOption[]} argv
   * @param {string[]} fields
   * @throws {FailureMissingArgument} On missing mandatory argument(s).
   */
  protected assertHasMandatoryArguments(
    argv: ContractOption[] | undefined,
    fields: string[]
  ): boolean {
    // check that all `fields` are present in context
    for (let i = 0, m = fields.length; i < m; i ++) {
      const value = this.context.getInput(fields[i], null)
      if (null === value) {
        throw new FailureMissingArgument('Missing argument "' + fields[i] + '"')
      }
    }

    return true
  }
}
