/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

 import {
  InnerTransaction,
  PublicAccount,
  Transaction,
  TransferTransaction,
  PlainMessage,
  UInt64,
  Mosaic,
  EmptyMessage,
} from 'symbol-sdk'

// internal dependencies
import {
  AllowanceResult,
  AssetIdentifier,
  ContractOption,
  Symbol,
} from '../../index'
import { Executable } from './Executable'

/**
 * @class Governable.CreateVote
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Class that describes a contract for starting a
 *              key ceremony with associates (other operators)
 *              thereby creating a new distributed organization.
 * @summary
 * This digital contract accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | operator | Public account of the operator | `new PublicAccount(...)` |
 *
 * The execution of this contract results in the creation of
 * the following list of transactions with  their respective
 * *signer* and a description:
 *
 * | Sequence | Type | Signer | Description |
 * | --- | --- | --- | --- |
 * | 01 | XTransaction | X Account | ... |
 *
 */
export class CreateVote extends Executable {
  /**
   * @access public
   * @description The list of **required** arguments to execute
   *              *this* digital contract.
   */
  public arguments: string[] = [
    'operator',
  ]

  /**
   * Verifies **allowance** of \a actor to execute a command
   * with arguments \a argv. This method returns true if all
   * required arguments are present.
   *
   * This method asserts the presence of mandatory arguments.
   *
   * Additionally, this method asserts that amounts of assets
   * do not overflow in relation with available pool reserves.
   *
   * @access public
   * @param   {PublicAccount}             actor   The actor is whom executes the contract.
   * @param   {Array<ContractOption>}     argv    The contract options (arguments).
   * @return  {AllowanceResult}           Returns whether an actor is authorized to execute this contract.
   * @throws  {FailureMissingArgument}    On missing mandatory argument(s).
   **/
  public canExecute(
    actor: PublicAccount,
    argv?: ContractOption[]
  ): AllowanceResult {
    // - Asserts the presence of mandatory inputs
    super.assertHasMandatoryArguments(argv, this.arguments)

    // - Allows anyone to start a new key ceremony
    return new AllowanceResult(true)
  }

  // region abstract methods
  /**
   * This method returns the automated pool command name,
   * e.g. "CreateDAO" or "CreateVote", etc.
   *
   * @access public
   * @return {string}
   **/
  public get name(): string {
    return 'CreateVote'
  }

  /**
   * This method returns the unique digital contract
   * descriptor for the `CreateVote` contract.
   *
   * @access public
   * @return {string}
   **/
  public get descriptor(): string {
    return 'Governable(v' + this.context.revision + ')' + ':create-vote:' + this.identifier.id
  }

  /**
   * This method returns a list of unsigned transactions in a
   * sequencial order of execution. The resulting transaction
   * array is later wrapped inside a digital contract that is
   * executed atomically such that either all transactions do
   * succeed or all transactions are cancelled.
   *
   * @see {execute()}
   * @access public
   * @return  {Transaction[]}   Given the execution of a contract, returns a list of unsigned transactions.
   **/
  protected get transactions(): Transaction[] {

    // - Reads the execution context
    const reader = this.context.reader as Symbol.Reader

    // - Prepares the response
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // - Assigns correct signer to each transaction
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

