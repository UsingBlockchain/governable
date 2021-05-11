/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import {
  Address,
  Convert,
  InnerTransaction,
  LockHashAlgorithm,
  PublicAccount,
  Transaction,
  TransferTransaction,
  PlainMessage,
  SecretProofTransaction,
  SHA3Hasher,
  TransactionType,
} from 'symbol-sdk'
import { Taxonomy, TaxonomyMap } from '@ubcdigital/symbol-taxonomy'

// internal dependencies
import {
  AllowanceResult,
  ContractOption,
  Symbol,
} from '../../index'
import { Executable } from './Executable'

/**
 * @class Governable.CommitAgreement
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Class that describes a contract for finalizing
 * a DAO launch agreement. Operators must be the same as those
 * whom previously executed the `CreateAgreement` contract.
 *
 * The funds locked by secret are hereby unlocked and owned by
 * the agreed upon target public account of the DAO.
 *
 * @see {Governable.CreateAgreement}
 * @summary
 * This digital contract accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | target | Target public account | `new PublicAccount(...)` |
 * | agreement | Agreement public account | `new PublicAccount(...)` |
 *
 * The execution of this contract results in the creation of
 * the following list of transactions with  their respective
 * *signer* and a description:
 *
 * | Sequence | Type | Signer | Description |
 * | --- | --- | --- | --- |
 * | 01 | SecretProof | Agreement Account | Proves the **agreement of operators** to start a DAO with the included **governance asset identifier**. |
 * | 02 | TransferTransaction | Agreement Account | Sends information containing the **target account public key** that is hereby being agreed upon. |
 * | 03 | TransferTransaction | Agreement Account | Adds an execution proof message sent to the **agreement account**. |
 */
export class CommitAgreement extends Executable {
  /**
   * @access public
   * @description The list of **required** arguments to execute
   *              *this* digital contract.
   */
  public arguments: string[] = [
    'target',
    'agreement',
  ]

  /**
   * @overwrite Definition of the sequence of appearance of
   * transactions inside a `CommitAgreement` contract.
   */
  public get specification(): Taxonomy {
    // - Prepares required transactions
    const requiredTxes = new TaxonomyMap([
      [0, { type: TransactionType.SECRET_PROOF, required: true }],
      [1, { type: TransactionType.TRANSFER, required: true }],
      [2, { type: TransactionType.TRANSFER, required: true }],
    ])

    // - Bundle into a "transaction taxonomy"
    return new Taxonomy(
      'Governable.CommitAgreement',
      requiredTxes,
    )
  }

  /**
   * Verifies **allowance** of \a actor to execute a contract
   * with arguments \a argv. This method asserts the presence
   * of mandatory arguments.
   *
   * Additionally, this method checks that there is no other
   * key ceremony that was **commited** to and *confirmed* on
   * the network, it also makes sure that the contract always
   * executes with *operators* readable from the network and
   * gives an allowance only to operator account.
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

    // - Reads the target account from arguments
    const newTarget = this.context.getInput('target', new PublicAccount())

    // - Allows anyone to commit to a DAO agreement except
    //   if another DAO agreement has been **commited** to
    //   and *confirmed* on the network. The argument used
    //   as the new target account must be the one agreed.
    return new AllowanceResult(this.agreement === undefined &&
      newTarget.address.equals(this.target.address)
    )
  }

  // region abstract methods
  /**
   * This method returns the digital contract name,
   * e.g. "CommitAgreement" or "CreateVote", etc.
   *
   * @access public
   * @return {string}
   **/
  public get name(): string {
    return 'CommitAgreement'
  }

  /**
   * This method returns the unique digital contract
   * descriptor for the `CommitAgreement` contract.
   *
   * @access public
   * @return {string}
   **/
  public get descriptor(): string {
    return 'Governable(v' + this.context.revision + ')' + ':commit-agreement:' + this.identifier.id
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

    // - Reads external arguments
    const agreement = this.context.getInput('agreement', new PublicAccount())

    // - Prepares unlocked secret
    const secret = new Uint8Array(32)
    SHA3Hasher.func(secret, Convert.utf8ToUint8(this.identifier.id), 32)

    // - Prepares the response
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // - Transaction 01: SecretProofTransaction
    transactions.push(SecretProofTransaction.create(
      this.context.parameters.deadline,
      LockHashAlgorithm.Op_Sha3_256,
      // formats secret to hexadecimal
      secret.reduce(
        (s, b) => s + b.toString(16).padStart(2, '0'),
        '', // initialValue
      ),
      this.target.address,
      this.identifier.id,
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 01 is issued by **agreement** account (multisig)
    signers.push(agreement)

    // Transaction 02: TransferTransaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      agreement.address,
      [],
      PlainMessage.create(this.target.publicKey),
      reader.networkType,
      undefined,
    ))

    // Transaction 02 is issued by **agreement** account (multisig)
    signers.push(agreement)

    // Transaction 03: TransferTransaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      agreement.address,
      [],
      PlainMessage.create(this.descriptor),
      reader.networkType,
      undefined,
    ))

    // Transaction 03 is issued by **agreement** account (multisig)
    signers.push(agreement)

    // - Assigns correct signer to each transaction
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

