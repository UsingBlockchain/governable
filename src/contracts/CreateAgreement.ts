/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
 import {
  EmptyMessage,
  InnerTransaction,
  LockHashAlgorithm,
  Mosaic,
  MultisigAccountModificationTransaction,
  PlainMessage,
  PublicAccount,
  SecretLockTransaction,
  Transaction,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk'
import { MnemonicPassPhrase } from 'symbol-hd-wallets'

// internal dependencies
import {
  AllowanceResult,
  AssetIdentifier,
  ContractOption,
  Symbol,
} from '../../index'
import { Executable } from './Executable'
import { TargetDerivationPath } from '../Governable'

/**
 * @class Governable.CreateAgreement
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Class that describes a contract for starting a
 * DAO launch agreement with associates (other operators), and
 * thereby initiating the process of creation of a distributed
 * organization.
 * Note that the first listed operator account will *fund* the
 * account used for the *agreement* with 1 `symbol.xym`.  This
 * amount is sent to the **target** account when the agreement
 * has been commited and confirmed by the network.
 *
 * @summary
 * This digital contract accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | password | A password to protect a mnemonic pass phrase | `'...'` |
 * | mnemonic | BIP39 mnemonic pass phrase to derive child accounts. | `new MnemonicPassPhrase(...)` |
 * | agreementPath | BIP44 derivation path to derive **agreement** account. | `'...'` |
 * | operators | Operators public accounts | `[new PublicAccount(...)]` |
 *
 * The execution of this contract results in the creation of
 * the following list of transactions with  their respective
 * *signer* and a description:
 *
 * | Sequence | Type | Signer | Description |
 * | --- | --- | --- | --- |
 * | 01 | MultisigAccountModificationTransaction | Agreement Account + Operators | Converts the **agreement account** in a multi-signature account where **cosignatories** are the **operator accounts**. |
 * | 02 | SecretLockTransaction | Operator Account | The *secret* used is the resulting **governance asset identifier**. If *unlocked*, sends an initial amount of `symbol.xym` to the **target account**. If not unlocked, expecting new agreement, with different *secret*. |
 * | 03 | TransferTransaction | Agreement Account | Sends information containing the **target account public key** that must be agreed upon in a subsequent `CommitAgreement` contract execution. |
 * | 04 | TransferTransaction | Agreement Account | Adds an execution proof message sent to the **agreement account**. |
 */
export class CreateAgreement extends Executable {
  /**
   * @access public
   * @description The list of **required** arguments to execute
   *              *this* digital contract.
   */
  public arguments: string[] = [
    'password',
    'mnemonic',
    'path',
    'operators',
  ]

  /**
   * Verifies **allowance** of \a actor to execute a contract
   * with arguments \a argv. This method asserts the presence
   * of mandatory arguments.
   *
   * Additionally, this method checks that there is no other
   * launch agreement that was *commited* to and confirmed
   * on the network.
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

    // - Allows anyone to start a new launch agreement except
    //   if another launch agreement has been **commited** to
    //   and *confirmed* on the network.
    return new AllowanceResult(
      this.agreement === undefined
    )
  }

  // region abstract methods
  /**
   * This method returns the digital contract name,
   * e.g. "CreateAgreement" or "CreateVote", etc.
   *
   * @access public
   * @return {string}
   **/
  public get name(): string {
    return 'CreateAgreement'
  }

  /**
   * This method returns the unique digital contract
   * descriptor for the `CreateAgreement` contract.
   *
   * @access public
   * @return {string}
   **/
  public get descriptor(): string {
    return 'Governable(v' + this.context.revision + ')' + ':create-agreement:' + this.identifier.id
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
    const signer = this.context.signer as Symbol.Signer

    // - Reads external arguments
    const password = this.context.getInput('password', '')
    const mnemonic = this.context.getInput('mnemonic', new MnemonicPassPhrase(''))
    const agreementPath = this.context.getInput('agreementPath', '')
    const operators = this.context.getInput('operators', [])

    // - Derives the **agreement** account in local scope
    const agreement = Symbol.Accountable.derive(
      mnemonic.toSeed(password),
      agreementPath,
      reader.networkType,
      signer,
    )

    // - Prepares the response
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // - Transaction 01: MultisigAccountModificationTransaction
    // :warning: minRemoval is always n-1 to permit loss of up to 1 key.
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      operators.length, // all operators for minApproval
      operators.length - 1, // all except one for minRemoval
      operators,
      [],
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 01 is issued by **agreement** account (multisig)
    signers.push(agreement.publicAccount)

    // - Transaction 02: SecretLockTransaction
    transactions.push(SecretLockTransaction.create(
      this.context.parameters.deadline,
      new Mosaic(reader.feeMosaicId, UInt64.fromUint(1)),
      UInt64.fromUint(720), // 720 blocks
      LockHashAlgorithm.Op_Sha3_256,
      this.identifier.id,
      this.target.address,
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 02 is issued by the first **operator** listed.
    signers.push(operators[0])

    // Transaction 03: TransferTransaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      agreement.address,
      [],
      PlainMessage.create(this.target.publicKey),
      reader.networkType,
      undefined,
    ))

    // Transaction 03 is issued by **agreement** account (multisig)
    signers.push(agreement.publicAccount)

    // Transaction 04: TransferTransaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      agreement.address,
      [],
      PlainMessage.create(this.descriptor),
      reader.networkType,
      undefined,
    ))

    // Transaction 04 is issued by **agreement** account (multisig)
    signers.push(agreement.publicAccount)

    // - Assigns correct signer to each transaction
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

