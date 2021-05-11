/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

import {
  AccountMetadataTransaction,
  AccountMosaicRestrictionTransaction,
  Address,
  EmptyMessage,
  InnerTransaction,
  KeyGenerator,
  Mosaic,
  MosaicAddressRestrictionTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicGlobalRestrictionTransaction,
  MosaicId,
  MosaicMetadataTransaction,
  MosaicNonce,
  MosaicRestrictionFlag,
  MosaicRestrictionType,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  MultisigAccountModificationTransaction,
  PlainMessage,
  PublicAccount,
  Transaction,
  TransferTransaction,
  UInt64,
  TransactionType,
} from 'symbol-sdk'
import { SemanticsMap, Taxonomy, TaxonomyMap } from '@ubcdigital/symbol-taxonomy'

// internal dependencies
import {
  AllowanceResult,
  ContractOption,
  MetadataBucket,
  Symbol,
} from '../../index'
import { Executable } from './Executable'

/**
 * @class Governable.CreateDAO
 * @package Governable
 * @subpackage Contracts
 * @since v1.0.0
 * @description Class that describes a contract for creating a
 *              distributed organization with operators. A key
 *              ceremony MUST have taken place before and also
 *              MUST be accessible through the network to read
 *              information about the agreed target public key.
 * @summary
 * This digital contract accepts the following arguments:
 *
 * | Argument | Description | Example |
 * | --- | --- | --- |
 * | operators | Organization operator public accounts | `[new PublicAccount(...)]` |
 * | metadata | Metadata associated to mosaic | `{'code': '87', ...}` |
 *
 * The execution of this contract results in the creation of
 * the following list of transactions with  their respective
 * *signer* and a description:
 *
 * | Sequence | Type | Signer | Description |
 * | --- | --- | --- | --- |
 * | 01 | MultisigAccountModificationTransaction | Target Account + Operators | Converts the **target account** in a multi-signature account where **cosignatories** are the **operator accounts**. |
 * | 02 | MosaicDefinitionTransaction | Target Account | Creates the governance mosaic. governance mosaics are distributed only to operators. There is **one** governance **mosaic** per each distributed organization. Governance mosaics have a *mutable* supply and are non-transferable. |
 * | 03 | MosaicSupplyChangeTransaction | Target Account | Creates the initial supply of governance assets. The amount issued is equal to the number of operators. |
 * | 04 | AccountMosaicRestrictionTransaction | Target Account | Restricts the **target** account such that it can **only hold** the concerned mosaics (i.e.: the governance mosaic and the network fee mosaic). :warning: This transaction protects the **target** account from SPAM transactions/mosaics. |
 * | 05 | MosaicGlobalRestrictionTransaction | Target Account | Restricts the **target** account such that it can **only hold** the concerned mosaics (i.e.: the governance mosaic and the network fee mosaic). :warning: This transaction protects the **target** account from SPAM transactions/mosaics. |
 * | 06 | MosaicAddressRestrictionTransaction | Target Account | Assigns the restriction value `1` ("Target") to the **target account address**. |
 * | 07 | MosaicMetadataTransaction | Target Account | Assigns the `Org_Id` metadata value to the governance **mosaic**. |
 * | 08 | AccountMetadataTransaction | Target Account | Assigns the `Org_Id` metadata value to the **target account**. |
 * | 09 | AccountMetadataTransaction | Target Account | Assigns the `Name` metadata value to the **target account**. |
 * | 10 | AccountMetadataTransaction | Target Account | Assigns the `Code` metadata value to the **target account**. |
 * | 11 | AccountMetadataTransaction | Target Account | Assigns the `Website` metadata value to the **target account**. |
 * | 12 | AccountMetadataTransaction | Target Account | Assigns the `Contact` metadata value to the **target account**. |
 * | 13 | AccountMetadataTransaction | Target Account | Assigns the `Description` metadata value to the **target account**. |
 * | 14 | AccountMetadataTransaction | Target Account | Assigns the `Image` metadata value to the **target account**. |
 * | 15..n | MosaicAddressRestrictionTransaction | Target Account | Assigns the restriction value `2` ("Operator") to the **operator accounts**. This transaction will be repeated per each operator. |
 * | 16..n | TransferTransaction | Target Account | Transfers the initially created supply of governance assets to the **operator accounts**. This transaction will be repeated per each operator. |
 * | n+1 | TransferTransaction | Target Account | Adds an execution proof message sent to the **target** account. |
 */
export class CreateDAO extends Executable {
  /**
   * @access public
   * @description The list of **required** arguments to execute
   *              *this* digital contract.
   */
  public arguments: string[] = [
    'target',
    'operators',
    'metadata', // @see {MetadataBucket}
  ]

  /**
   * @overwrite Definition of the sequence of appearance of
   * transactions inside a `CommitAgreement` contract.
   */
  public get specification(): Taxonomy {
    // - Prepares required transactions
    const requiredTxes = new TaxonomyMap([
      [0, { type: TransactionType.MULTISIG_ACCOUNT_MODIFICATION, required: true }],
      [1, { type: TransactionType.MOSAIC_DEFINITION, required: true }],
      [2, { type: TransactionType.MOSAIC_SUPPLY_CHANGE, required: true }],
      [3, { type: TransactionType.ACCOUNT_MOSAIC_RESTRICTION, required: true }],
      [4, { type: TransactionType.MOSAIC_GLOBAL_RESTRICTION, required: true }],
      [5, { type: TransactionType.MOSAIC_ADDRESS_RESTRICTION, required: true }],
      [6, { type: TransactionType.MOSAIC_METADATA, required: true }],
      [7, { type: TransactionType.ACCOUNT_METADATA, required: true }],
      [8, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [9, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [10, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [11, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [12, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [13, { type: TransactionType.ACCOUNT_METADATA, required: false }],
      [14, { type: TransactionType.MOSAIC_ADDRESS_RESTRICTION, required: true }],
      [15, { type: TransactionType.TRANSFER, required: true }],
      [16, { type: TransactionType.TRANSFER, required: true }],
    ])

    // - Prepares bundling rules, repeating, etc.
    const semanticsRules = new SemanticsMap([
      [14, { bundleWith: [15], repeatable: true, minOccurences: 1, maxOccurences: 0}]
    ])

    // - Bundle into a "transaction taxonomy"
    return new Taxonomy(
      'Governable.CreateDAO',
      requiredTxes,
      semanticsRules,
    )
  }

  /**
   * Verifies **allowance** of \a actor to execute a contract
   * with arguments \a argv. This method asserts the presence
   * of mandatory arguments.
   *
   * Additionally, this method asserts that the argument used
   * for the `target` contract option refers to the correctly
   * derived target account of a distributed organization.
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

    //XXX operators count minimum 2 (or more?)

    // - Allows anyone to start a new DAO provided correct
    //   target account is used and given that a confirmed
    //   agreement can be read from the network.
    return new AllowanceResult(!!this.agreement &&
      newTarget.address.equals(this.target.address)
    )
  }

  // region abstract methods
  /**
   * This method returns the digital contract name,
   * e.g. "CreateDAO" or "CreateVote", etc.
   *
   * @access public
   * @return {string}
   **/
  public get name(): string {
    return 'CreateDAO'
  }

  /**
   * This method returns the unique digital contract
   * descriptor for the `CreateDAO` contract.
   *
   * @access public
   * @return {string}
   **/
  public get descriptor(): string {
    return 'Governable(v' + this.context.revision + ')' + ':create-dao:' + this.identifier.id
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
    const operators: PublicAccount[] = this.context.getInput('operators', [])
    const metadata = this.context.getInput('metadata', new MetadataBucket(
      '', // Company name
      '', // Industry code (SIC/NAICS)
      '', // Website
      '', // Contact
      '', // Description
      '', // Image
      {}, // customMetadata
    ))

    // - Prepares the response
    const transactions: InnerTransaction[] = []
    const signers: PublicAccount[] = []

    // - Transaction 01: MultisigAccountModificationTransaction
    // :warning: minRemoval is always n-1 to permit loss of up to 1 key.
    transactions.push(MultisigAccountModificationTransaction.create(
      this.context.parameters.deadline,
      operators.length, // all operators for minApproval
      operators.length - 1, // all except one for minRemoval
      operators.map(o => o.address),
      [],
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // Transaction 01 is issued by **target** account (multisig)
    signers.push(this.target)

    // - Transaction 02: MosaicDefinitionTransaction
    const mosaicNonce = MosaicNonce.createFromHex(this.identifier.id)
    const mosaicId = MosaicId.createFromNonce(mosaicNonce, this.target.address)
    transactions.push(MosaicDefinitionTransaction.create(
      this.context.parameters.deadline,
      mosaicNonce,
      mosaicId,
      MosaicFlags.create(true, false, true), // mutable supply + non-transferable.
      0,
      UInt64.fromUint(0), // do-not-expire
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // - Transaction 02 is issued by **target** account
    signers.push(this.target)

    // - Transaction 03: MosaicSupplyChangeTransaction
    transactions.push(MosaicSupplyChangeTransaction.create(
      this.context.parameters.deadline,
      mosaicId,
      MosaicSupplyChangeAction.Increase,
      UInt64.fromUint(operators.length), // issued supply = count of operators
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // - Transaction 03 is issued by **target** account
    signers.push(this.target)

    // - Transaction 04: AccountMosaicRestrictionTransaction
    // :warning: This transaction **restricts** the account to accept only
    //           the listed mosaics. Transfers to this account which contain 
    //           any other mosaic(s) will not be accepted by the network anymore.
    transactions.push(AccountMosaicRestrictionTransaction.create(
      this.context.parameters.deadline,
      MosaicRestrictionFlag.AllowMosaic,
      [
        mosaicId, // governance assets
        reader.feeMosaicId, // network fee mosaic
      ],
      [],
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // - Transaction 04 is issued by **target** account
    signers.push(this.target)

    // Transaction 05: MosaicGlobalRestriction with mosaicId (refId 0)
    // :warning: This restricts the **mosaic** to accounts who have the 
    //           'User_Role' flag set to less or equal 2 ("Operator" | "Target").
    transactions.push(MosaicGlobalRestrictionTransaction.create(
      this.context.parameters.deadline,
      mosaicId,
      KeyGenerator.generateUInt64Key('User_Role'),
      UInt64.fromUint(0), // previousRestrictionValue
      MosaicRestrictionType.NONE, // previousRestrictionType
      UInt64.fromUint(2), // newRestrictionValue: 1 = Target ; 2 = Operator ; 3 = Guest
      MosaicRestrictionType.LE, // newRestrictionType: `less or equal to`
      reader.networkType,
      undefined, // referenceMosaicId: empty means "self"
      undefined, // maxFee 0 for inner
    ))

    // Transaction 05 is issued by **target** account (multisig)
    signers.push(this.target)

    // Transaction 06: MosaicAddressRestriction for target address
    transactions.push(MosaicAddressRestrictionTransaction.create(
      this.context.parameters.deadline,
      mosaicId,
      KeyGenerator.generateUInt64Key('User_Role'),
      this.target.address,
      UInt64.fromUint(1), // newRestrictionValue: 1 = Target
      reader.networkType,
      undefined, // previousRestrictionValue
      undefined, // maxFee 0 for inner
    ))

    // Transaction 06 is issued by the target account
    signers.push(this.target)

    // - Transaction 07 MosaicMetadataTransaction attaching `Org_Id`
    transactions.push(MosaicMetadataTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      KeyGenerator.generateUInt64Key('Org_Id'),
      mosaicId,
      this.identifier.id.length,
      this.identifier.id,
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // - Transaction 07 is issued by **target** account
    signers.push(this.target)

    // - Transaction 08: AccountMetadataTransaction attaching `Org_Id`
    transactions.push(AccountMetadataTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      KeyGenerator.generateUInt64Key('Org_Id'),
      this.identifier.id.length,
      this.identifier.id,
      reader.networkType,
      undefined, // maxFee 0 for inner
    ))

    // - Transaction 08 is issued by **target** account
    signers.push(this.target)

    if (metadata.name.length) {
      // - Transaction 09: AccountMetadataTransaction attaching `Name`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Name'),
        metadata.name.length,
        metadata.name,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 09 is issued by **target** account
      signers.push(this.target)
    }

    if (metadata.code.length) {
      // - Transaction 10: AccountMetadataTransaction attaching `Code`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Code'),
        metadata.code.length,
        metadata.code,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 10 is issued by **target** account
      signers.push(this.target)
    }

    if (metadata.website.length) {
      // - Transaction 11: AccountMetadataTransaction attaching `Website`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Website'),
        metadata.website.length,
        metadata.website,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 11 is issued by **target** account
      signers.push(this.target)
    }

    if (metadata.contact.length) {
      // - Transaction 12: AccountMetadataTransaction attaching `Contact`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Contact'),
        metadata.contact.length,
        metadata.contact,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 12 is issued by **target** account
      signers.push(this.target)
    }

    if (metadata.description.length) {
      // - Transaction 13: AccountMetadataTransaction attaching `Description`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Description'),
        metadata.description.length,
        metadata.description,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 13 is issued by **target** account
      signers.push(this.target)
    }

    if (metadata.image.length) {
      // - Transaction 14: AccountMetadataTransaction attaching `Image`
      transactions.push(AccountMetadataTransaction.create(
        this.context.parameters.deadline,
        this.target.address,
        KeyGenerator.generateUInt64Key('Image'),
        metadata.image.length,
        metadata.image,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 14 is issued by **target** account
      signers.push(this.target)
    }

    const govMosaicId = this.identifier.toMosaicId()
    for (let i = 0, m = operators.length; i < m; i++) {
      // Transaction 15: MosaicAddressRestriction
      transactions.push(MosaicAddressRestrictionTransaction.create(
        this.context.parameters.deadline,
        mosaicId,
        KeyGenerator.generateUInt64Key('User_Role'),
        operators[i].address,
        UInt64.fromUint(2), // newRestrictionValue: 2 = Operator
        reader.networkType,
        undefined, // previousRestrictionValue
        undefined, // maxFee 0 for inner
      ))

      // Transaction 15 is issued by the target account
      signers.push(this.target)

      // Transaction 16: TransferTransaction
      transactions.push(TransferTransaction.create(
        this.context.parameters.deadline,
        operators[i].address,
        [new Mosaic(govMosaicId, UInt64.fromUint(1))],
        EmptyMessage,
        reader.networkType,
        undefined, // maxFee 0 for inner
      ))

      // - Transaction 16 is issued by **target** account
      signers.push(this.target)
    }

    // Transaction n+1: TransferTransaction
    transactions.push(TransferTransaction.create(
      this.context.parameters.deadline,
      this.target.address,
      [],
      PlainMessage.create(this.descriptor),
      reader.networkType,
      undefined,
    ))

    // Transaction n+1 is issued by **target** account
    signers.push(this.target)

    // - Assigns correct signer to each transaction
    return transactions.map(
      (transaction, i) => transaction.toAggregate(signers[i])
    )
  }
  // end-region abstract methods
}

