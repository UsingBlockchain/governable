/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

import { TransactionURI } from 'symbol-uri-scheme'
import {
  Address,
  AggregateTransaction,
  MosaicInfo,
  PublicAccount,
  Transaction,
  TransactionMapping,
} from 'symbol-sdk'
import { Taxonomy } from '@ubcdigital/symbol-taxonomy'

// internal dependencies
import {
  AllowanceResult,
  AssetIdentifier,
  BaseContract,
  ContractOption,
  Context,
  FailureEmptyContract,
  Symbol,
} from '../../index'
import { MetadataBucket } from '../models/MetadataBucket'

/**
 * @abstract
 * @class Governable.Executable
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Abstract class that describes a digital contract.
 *              This is the base layer for defining an executable
 *              digital contract available to a DAO as defined in
 *              this package.
 */
export abstract class Executable extends BaseContract {

  /**
   * @access public
   * @description The transaction representing a **committed**
   *              DAO agreement that has been confirmed on the
   *              network.
   */
  public agreement: AggregateTransaction | undefined

  /**
   * @access public
   * @description The deterministic public account which owns a
   *              governable organization. This account is used
   *              to issue the *organization governance* mosaic.
   */
  public target: PublicAccount

  /**
   * @access public
   * @description List of operators of a distributed organization.
   */
  public operators: Address[] = []

  /**
   * @access public
   * @description Mosaic information for the network-wide created
   *              organization governance assets.
   */
  public mosaicInfo: MosaicInfo | undefined

  /**
   * @access public
   * @description Metadata about the distributed organization.
   */
  public metadata: MetadataBucket | undefined

  /**
   * @access public
   * @description The list of **required** arguments to execute
   *              a digital contract related to a DAO.
   */
  public arguments: string[] = []

  /**
   * Construct an executable command object around \a context
   * and an \a identifier of organization governance mosaics.
   *
   * @access public
   * @param   {Context}           context       The execution context.
   * @param   {AssetIdentifier}   identifier    The organization governance asset identifier.
   */
  public constructor(
    /**
     * @readonly
     * @access public
     * @description The execution context.
     */
    public readonly context: Context,

    /**
     * @readonly
     * @access public
     * @description The organization governance asset identifier.
     */
    protected readonly identifier: AssetIdentifier,
  ) {
    super(context)
    this.target = this.identifier.target
  }

  // region abstract methods
  /**
   * This method MUST return the digital contract name,
   * e.g. "CreateDAO" or "CreateVote", etc.
   *
   * @abstract
   * @access public
   * @return {string}
   **/
  public abstract get name(): string

  /**
   * This method MUST return a unique digital contract
   * descriptor which includes:
   *
   * - the open standard descriptor (e.g.: "Governable") ;
   * - the open standard *revision* (e.g.: 1) ;
   * - the kebab-case command name (e.g.: "create-dao") ;
   * - and the governance asset identifier.
   *
   * Items are joined with the `:` operator and attached to a
   * so-called execution proof transaction.
   *
   * @abstract
   * @access public
   * @return {string}
   **/
  public abstract get descriptor(): string

  /**
   * This method MUST return a transaction taxonomy.
   *
   * @abstract
   * @access public
   * @return {Taxonomy}
   */
  public abstract get specification(): Taxonomy

  /**
   * This method MUST return a list of unsigned transactions.
   * Transactions returned here will then be wrapped inside a
   * transaction URI in the `execute()` method.
   *
   * @see {execute()}
   * @abstract
   * @access public
   * @return  {AggregateTransaction[]}   Given the execution of a contract, returns the resulting transactions list.
   **/
  protected abstract get transactions(): Transaction[]
  // end-region abstract methods

  /**
   * Verifies **allowance** of \a actor to execute a contract
   * with arguments \a argv. By default, this method returns
   * true *only* if the actor is the target public account.
   *
   * This method asserts the presence of mandatory arguments.
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

    // - By default, only target can execute contracts ("owner only")
    const isOperator = actor.address.equals(
      this.target.address
    ) as boolean

    return new AllowanceResult(isOperator)
  }

  /**
   * Executes a digital contract with \a actor given
   * \a argv contract options.
   *
   * @access public
   * @param   {PublicAccount}             actor   The actor is whom executes the contract.
   * @param   {Array<ContractOption>}     argv    The contract options (arguments).
   * @return  {TransactionURI<T>}         Returns one transaction URI with all transactions.
   * @throws  {FailureMissingArgument}    On missing mandatory argument(s).
   * @throws  {FailureOperationForbidden} On denial of authorization.
   **/
  public execute(
    actor: PublicAccount,
    argv?: ContractOption[]
  ): TransactionURI<Transaction> {
    // - Verifies the authorization to execute
    super.assertExecutionAllowance(actor, argv)

    // - Creates a digital contract for this execution
    const contract = this.prepare()

    // - Formats the result as a transaction URI
    return new TransactionURI(contract.serialize(), TransactionMapping.createFromPayload)
  }

  /**
   * Wraps the resulting transactions inside an aggregate bonded
   * transaction. We will later refer to this transaction as the
   * **digital contract**.
   *
   * Prior to announcing this digital contract to a network, and
   * waiting for it to be included in a new block, you must also
   * announce a HashLockTransaction to allow the use of contracts.
   *
   * @link https://docs.symbolplatform.com/serialization/lock_hash.html#hash-lock-transaction
   * @link https://docs.symbolplatform.com/concepts/aggregate-transaction.html#id3
   *
   * @access protected
   * @return  {AggregateTransaction} Aggregate bonded transaction
   * @throws  {FailureEmptyContract} Given a misconfigured digital contract which is empty.
   **/
  protected prepare(): AggregateTransaction | Transaction {
    // - Sanity check
    if (!this.transactions.length) {
      throw new FailureEmptyContract('No transactions result from the execution of this contract.')
    }

    // - Shortcut for network information
    const reader = this.context.reader as Symbol.Reader

    // - Creates a so-called digital contract
    return AggregateTransaction.createBonded(
      this.context.parameters.deadline,
      this.transactions,
      reader.networkType,
      [], // "unsigned"
      this.context.parameters.maxFee,
    )
  }
}
