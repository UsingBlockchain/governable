/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import { of } from 'rxjs'
import { catchError, timestamp } from 'rxjs/operators'
import { TransactionURI } from 'symbol-uri-scheme'
import { MnemonicPassPhrase } from 'symbol-hd-wallets'
import {
  Address,
  AggregateTransaction,
  MosaicInfo,
  PublicAccount,
  Transaction,
} from 'symbol-sdk'

// internal dependencies
import { DAOContracts as ContractsImpl } from './contracts/index'
import { Executable } from './contracts/Executable'
import {
  AllowanceResult,
  AssetIdentifier,
  AssetSource,
  MetadataBucket,
  Contract,
  ContractOption,
  Context,
  FailureInvalidContract,
  FailureInvalidAgreement,
  Organization,
  TransactionParameters,
} from '../index'
import {
  Accountable,
  Reader as ReaderImpl,
  Signer as SignerImpl,
} from './adapters/Symbol'

// services are *not* exported
import { AgreementService } from './services/AgreementService'
import { MultisigService } from './services/MultisigService'
import { TransactionService } from './services/TransactionService'
import { MetadataService } from './services/MetadataService'

/**
 * @type Governable.ContractFn
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Type that describes digital contract function pointers.
 */
type ContractFn = (c: Context, i: AssetIdentifier) => Contract

/**
 * @type Governable.ContractsList
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @internal
 * @description Type that describes digital contract lists.
 */
type ContractsList = {
  [id: string]: ContractFn
}

/**
 * @type Governable.OrganizationMetadata
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Class that describes organization metadata
 * @see {MetadataBucket}
 */
 export class OrganizationMetadata extends MetadataBucket {}

/**
 * @var Governable.DigitalContracts
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Object that describes a list of available digital contracts.
 */
export const DigitalContracts: ContractsList = {
  'CreateAgreement': (c, i): Contract => new ContractsImpl.CreateAgreement(c, i),
  'CommitAgreement': (c, i): Contract => new ContractsImpl.CommitAgreement(c, i),
  'CreateDAO': (c, i): Contract => new ContractsImpl.CreateDAO(c, i),
  'CreateVote': (c, i): Contract => new ContractsImpl.CreateVote(c, i),
  'Vote': (c, i): Contract => new ContractsImpl.Vote(c, i),
}

/**
 * @var Governable.TargetDerivationPath
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Contains text that describes the derivation path for the
 *              target account of distributed organizations.
 */
export const TargetDerivationPath: string = 'm/44\'/4343\'/0\'/0\'/0\''

/**
 * @var Governable.VotingDerivationPath
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Contains text that describes the derivation path for the
 *              voting account of operators.   Voting accounts **can't**
 *              be linked back to actual operator account. This prevents
 *              valuable / personal data to ever be published in voting.
 *              This method intentionally picks the `1000th` account to
 *              be derived, such that the account can not be tracked up
 *              to the original operator account.
 */
export const VotingDerivationPath: string = 'm/44\'/4343\'/999\'/0\'/0\''

/**
 * @var Governable.Revision
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Object that describes the count of revisions for Governable entities.
 */
export const Revision: number = 1

/**
 * @class Governable.DistributedOrganization
 * @package Governable
 * @subpackage Standard
 * @since v1.0.0
 * @description Generic class to describe Governable distributed organizations.
 *
 * A distributed organization is represented by the following properties,
 * which have to be agreed upon by operators during an initial launch agreement:
 *
 * - An agreement transaction: Consists of a multi-signature account which uses
 *   `SecretLockTransaction` and `TransferTransaction` to prove a DAO agreement
 *   of operators on-chain.
 *
 * - A target account: Consists of a public account that was agreed upon by
 *   operators to represent the distributed organization as an entity. This
 *   account will be converted to a multi-signature account where cosigners
 *   are the operators of the DAO.
 *
 * - A governance mosaic: Consists of a digital asset that is created only
 *   for the purposes of keeping track of operators' ability to help with
 *   decision making in a distributed organization. Governance mosaics are
 *   always non-transferrable. This implies that a *transfer* of authority
 *   is not possible and enforces an *agreement* to be persisted on-chain.
 */
export class DistributedOrganization implements Organization {

  /**
   * @description The transaction representing a **committed**
   * DAO agreement that has been confirmed on the network.
   *
   * If left empty, distributed organizations only allow to
   * execute the contract `CreateAgreement`. This is to force
   * a mandatory agreement of operators about *target account
   * and governance asset identifier*.
   */
  public agreement: AggregateTransaction | undefined

  /**
   * @description The deterministic public account which owns a
   * governable organization. This account is used to issue the
   * *organization governance* mosaic.
   *
   * This account *must* be converted to multi-signature during
   * the `CreateDAO` contract execution.
   */
  public target: PublicAccount

  /**
   * @description The source blockchain network of assets used
   * by a distributed organization. This instance usually will
   * hold either of a generation hash, a genesis block hash or
   * a forked block hash.
   */
  public source: AssetSource

  /**
   * @description Mosaic information for the network-wide created
   * organization governance assets.
   *
   * This mosaic *must* be non-transferrable such that updates
   * to the governance structure of the DAO are only possible
   * with the agreement of operators.
   */
  public mosaicInfo: MosaicInfo | undefined

  /**
   * @description List of operators of a distributed organization.
   *
   * These addresses can be any address on the source network. As
   * an operator of a DAO, these address will be attributed assets
   * that are used in governance duties in a DAO.
   */
  public operators: Address[] = []

  /**
   * @description Metadata about the distributed organization.
   *
   * Information that is saved in a metadata bucket include: name
   * of the DAO, website and contact links, optionally a logo for
   * the DAO and other custom metadata fields.
   */
  public metadata: OrganizationMetadata | undefined

  /**
   * Constructs a distributed organization instance around a
   * name of \a name, a network reader \a reader and a signer
   * implementation of \a signer. Also \a bip39 mnemonic pass
   * phrases are used to derive deterministic child accounts,
   * and \a password is used to encrypt the BIP39 mnemonic.
   *
   * Optionally, \a agreementHash can be passed to this method
   * in order to indicate a previous DAO launch agreement that
   * was *commited* to and *confirmed* on the network. If left
   * empty, this instance will be forced to use contracts that
   * are creating and commiting said *agreement*.
   *
   * @param   {string}              name        The name of the distributed organization (e.g.: "SWAPS CLOUD").
   * @param   {ReaderImpl}          reader      The blockchain network reader configuration.
   * @param   {SignerImpl}          signer      The digital signature implementation ("key provider").
   * @param   {MnemonicPassPhrase}  bip39       The mnemonic pass phrase ("24-words"). Caution here.
   * @param   {string}              password    The password with which to protect the BIP39 seed.
   */
  public constructor(
    /**
     * @access public
     * @description The name of the distributed organization.
     *
     * This name usually refers to the operational aspect of a
     * distributed organization. It can be any series of UTF-8
     * characters, e.g. "Using Blockchain Ltd".
     */
    public readonly name: string,

    /**
     * @readonly
     * @access public
     * @description The blockchain network reader configuration.
     *
     * Our first implementation uses a Symbol blockchain network
     * adapter as ReaderImpl and SignerImpl. It is possible that
     * other network adapters are implemented in the future.
     */
    public readonly reader: ReaderImpl,

    /**
     * @readonly
     * @access protected
     * @description The digital signature implementation ("key provider").
     *
     * Our first implementation uses a Symbol blockchain network
     * adapter as ReaderImpl and SignerImpl. It is possible that
     * other network adapters are implemented in the future.
     */
    protected readonly signer: SignerImpl,

    /**
     * @readonly
     * @access protected
     * @description The mnemonic pass phrase ("24-words"). Caution here.
     *
     * :warning: This information is highly sensitive. In case you
     * you are willing to host/deploy distributed orgs, please do
     * take caution when handling the aforementioned mnemonic pass
     * phrase.
     */
    protected readonly bip39: MnemonicPassPhrase,

    /**
     * @readonly
     * @access protected
     * @description The password used to protect the mnemonic pass phrase
     *              in case of theft.
     * 
     * :warning: This information is highly sensitive. In case you
     * you are willing to host/deploy distributed orgs, please do
     * take caution when handling the aforementioned password.
     */
     protected readonly password: string,

    /**
     * @readonly
     * @access protected
     * @description The agreement transaction hash. This optional argument
     * is used to read information about an agreed upon DAO agreement that
     * has taken place before. If left empty, this instance will be forced
     * to use contracts that create and commit said *agreement*.
     */
     protected readonly agreementHash?: string,
  ) {
    // - Derives **target** account in local scope
    const account = Accountable.derive(
      bip39.toSeed(this.password),
      TargetDerivationPath,
      this.reader.networkType,
      signer,
    )

    // - Only store the public account in memory
    this.target = account.publicAccount

    // - Set asset source network configuration
    this.source = new AssetSource(this.reader.generationHash)
  }

  /**
   * Getter for the deterministic asset identifier related to
   * the organization's governance mosaic that was created on
   * the network. At any time, there is always one identifier
   * per distributed organization. Other identifiers may have
   * existed in the past, as such only the *last commited* to
   * DAO launch agreement should be taken into account.
   *
   * @access public
   * @return {AssetIdentifier}
   */
  public get identifier(): AssetIdentifier {
    // - Creates the deterministic asset identifier
    return AssetIdentifier.createForSource(
      this.name,
      this.target,
      this.source,
    )
  }

  /**
   * Synchronize the contract execution with the network. This
   * method shall be used to fetch data required for / before
   * the execution of a digital contract.
   *
   * @async
   * @override {Organization.synchronize()}
   * @access public
   * @return  {Promise<boolean>}
   * @throws  {FailureInvalidAgreement}    On invalid DAO launch agreement (@see `CommitAgreement`).
   */
  public async synchronize(): Promise<boolean> {
    // - Prepares synchronization (context and endpoints)
    const context = this.getContext(this.target, new TransactionParameters())
    const mosaicHttp = (context.reader as ReaderImpl).factoryHttp.createMosaicRepository()
    const multisigHttp = (context.reader as ReaderImpl).factoryHttp.createMultisigRepository()
    const transactions = new TransactionService(context)
    const metadataServ = new MetadataService(context)

    if (this.agreementHash && this.agreementHash.length) {
      // - Reads information about commited and confirmed *DAO launch agreements*
      this.agreement = await transactions.readTransactionFromNetwork(
        this.agreementHash
      ) as AggregateTransaction
    }
    // - If no DAO agreement was commited yet, stop here.
    else return true

    // - Checks the authenticity of an agreement transaction
    if (false === AgreementService.verifyAuthenticity(
      context, this.identifier, this.agreement
    )) {
      // - Invalid DAO launch agreements are not accepted.
      throw new FailureInvalidAgreement('Authenticity verification failed for DAO launch agreement.')
    }

    try {
      // - Reads information about the governance mosaic
      this.mosaicInfo = await mosaicHttp.getMosaic(this.identifier.toMosaicId()).pipe(
        catchError(e => { console.error(e); return of(undefined) })
      ).toPromise()
    }
    catch (e) {}

    try {
      // - Reads information about *operators*
      const graph = await multisigHttp.getMultisigAccountGraphInfo(
        this.target.address
      ).toPromise()

      this.operators = MultisigService.getMultisigAccountInfoFromGraph(graph)
        .map(m => m.cosignatoryAddresses)
        .reduce((prev, it) => prev.concat(it))
    }
    catch (e) {}

    try {
      // - Reads information about metadata from the network
      this.metadata = await metadataServ.readMetadataFromNetwork(
        this.target.address
      )
    }
    catch (e) {}

    // - Done synchronizing network information
    return true
  }

  /**
   * Verifies the autorization for \a actor to execute a contract
   * \a contract given a \a governAssetId organization governance 
   * asset identifier.
   *
   * @access public
   * @param   {PublicAccount}           actor           The actor is whom executes the contract.
   * @param   {AssetIdentifier}         governAssetId   The governance asset identifier.
   * @param   {string}                  contract        The digital contract name.
   * @param   {Array<ContractOption>}   argv            The contract options (arguments).
   * @return  {AllowanceResult}         Returns whether an actor is authorized to execute said contract.
   **/
  public canExecute(
    actor: PublicAccount,
    governAssetId: AssetIdentifier,
    contract: string,
    argv: ContractOption[]
  ): AllowanceResult {
    // - Instanciates the contract and context
    const params = new TransactionParameters()
    const context = this.getContext(actor, params, argv)
    const cmdFn = this.getContract(governAssetId, contract, context) as Executable

    // - Populate the synchronized data
    cmdFn.mosaicInfo = this.mosaicInfo
    cmdFn.operators  = this.operators
    cmdFn.agreement  = this.agreement
    cmdFn.metadata   = this.metadata

    // - Uses `canExecute` from underlying \a contract
    return cmdFn.canExecute(actor, argv)
  }

  /**
   * Executes \a contract given \a governAssetId organization
   * governance asset identifier, \a actor public account and 
   * \a argv contract execution options and \a parameters for
   * network broadcasting.
   *
   * @access public
   * @param   {PublicAccount}               actor           The actor is whom executes the command.
   * @param   {AssetIdentifier}             governAssetId   The organization's governance asset identifier.
   * @param   {string}                      contract        The digital contract name. (e.g. "CreateVote").
   * @param   {TransactionParameters}       parameters      The transaction parameters (network specific).
   * @param   {Array<ContractOption>}       argv            The contract execution options (arguments).
   * @return  {Promise<TransactionURI>}     A digital contract that must be signed by the actor and possibly by the target account.
   **/
  public async execute(
    actor: PublicAccount,
    governAssetId: AssetIdentifier,
    contract: string,
    parameters: TransactionParameters,
    argv: ContractOption[],
  ): Promise<TransactionURI<Transaction>> {
    // - Reads network information from blockchain "reader"
    await this.synchronize()

    try {
      // - Instanciates a contract and context
      const context = this.getContext(actor, parameters, argv)
      const cmdFn = this.getContract(governAssetId, contract, context) as Executable

      // - Populates the synchronized data
      cmdFn.mosaicInfo = this.mosaicInfo
      cmdFn.operators  = this.operators
      cmdFn.agreement  = this.agreement
      cmdFn.metadata   = this.metadata

      // - Executes the digital contract
      return cmdFn.execute(actor, argv)
    }
    catch (f) {
      // XXX error notifications / events
      throw f
    }
  }

  /**
   * Executes \a contract given \a governAssetId organization
   * governance asset identifier, \a actor public account and 
   * \a argv contract execution options and \a parameters for
   * network broadcasting.
   *
   * This method does **not** call the `synchronize()` method.
   *
   * @access public
   * @param   {PublicAccount}               actor           The actor is whom executes the command.
   * @param   {AssetIdentifier}             governAssetId   The organization's governance asset identifier.
   * @param   {string}                      contract        The digital contract name. (e.g. "CreateVote").
   * @param   {TransactionParameters}       parameters      The transaction parameters (network specific).
   * @param   {Array<ContractOption>}       argv            The contract execution options (arguments).
   * @return  {Promise<TransactionURI>}     A digital contract that must be signed by the actor and possibly by the target account.
   **/
  public executeOffline(
    actor: PublicAccount,
    governAssetId: AssetIdentifier,
    contract: string,
    parameters: TransactionParameters,
    argv: ContractOption[],
  ): TransactionURI<Transaction> {
    // does-not-call-synchronize()

    try {
      // - Instanciates a contract in a context
      const context = this.getContext(actor, parameters, argv)
      const cmdFn = this.getContract(governAssetId, contract, context) as Executable

      // - Populates the synchronized data
      cmdFn.mosaicInfo = this.mosaicInfo
      cmdFn.operators  = this.operators
      cmdFn.agreement  = this.agreement
      cmdFn.metadata   = this.metadata

      // - Executes the digital contract
      return cmdFn.execute(actor, argv)
    }
    catch (f) {
      // XXX error notifications / events
      throw f
    }
  }

  /// region protected methods
  /**
   * Returns an execution context around an \a actor, \a argv
   * contract options and \a parameters transaction parameters.
   *
   * @access protected
   * @param   {PublicAccount}             actor       The actor in said execution context.
   * @param   {TransactionParameters}     parameters  The transaction parameters.
   * @param   {ContractOption[]}          argv        The execution options.
   * @return  {Context}                   The pre-configured *execution context*.
   */
  protected getContext(
    actor: PublicAccount,
    parameters: TransactionParameters,
    argv?: ContractOption[],
  ): Context {
    return new Context(
      Revision,
      actor,
      this.reader,
      this.signer,
      parameters,
      argv
    )
  }

  /**
   * Returns an executable instance for \a contract given \a context
   * and \a governAssetId.
   *
   * @see {Governable.DigitalContracts}
   * @access protected
   * @param   {AssetIdentifier} governAssetId     The governance asset identifier.
   * @param   {string}          command           The digital contract name (e.g. "CreateVote").
   * @param   {Context}         context           The contract execution context (arguments).
   * @return  {Contract}                  The contract instance pre-configured with the execution context.
   * @throws  {FailureInvalidContract}    On invalid digital contract name.
   */
  protected getContract(
    governAssetId: AssetIdentifier,
    command: string,
    context: Context,
  ): Contract {
    // validate digital contract
    if (!DigitalContracts || !DigitalContracts[command]) {
      throw new FailureInvalidContract('Invalid digital contract name.')
    }

    return DigitalContracts[command](context, governAssetId)
  }
  /// end-region protected methods
}
