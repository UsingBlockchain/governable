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
  AssetIdentifier,
  ContractOption,
  Reader,
  TransactionParameters,
} from '../../index'

/**
 * @interface Organization
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Interface that describes a *governable* organization.
 */
export interface Organization {
  /**
   * @description A blockchain reader adapter.
   */
  readonly reader: Reader

  /**
   * Synchronizes a contract execution with the network. This method shall
   * be used to fetch data required for execution (sometimes optional).
   *
   * @async
   * @return {Promise<boolean>}
   */
  synchronize(): Promise<boolean>

  /**
   * Verifies the autorization for \a actor to execute a contract
   * \a contract given a \a governAssetId organization governance 
   * asset identifier.
   *
   * @access public
   * @param   {PublicAccount}           actor           The actor is whom executes a contract.
   * @param   {AssetIdentifier}         governAssetId   The organization's governance asset identifier.
   * @param   {string}                  contract        The digital contract name.
   * @param   {Array<ContractOption>}   argv            The contract execution options (arguments).
   * @return  {AllowanceResult}         Returns whether an actor is authorized to execute said contract.
   **/
  canExecute(
    actor: PublicAccount,
    governAssetId: AssetIdentifier,
    contract: string,
    argv: ContractOption[]
  ): AllowanceResult

  /**
   * Executes \a contract given \a governAssetId organization
   * governance asset identifier, \a actor public account and 
   * \a argv contract execution options and \a parameters for
   * network broadcasting.
   *
   * @internal This method MUST use the `Contract.execute()` method.
   * @internal This method MUST call the `synchronize()` method.
   * @param   {PublicAccount}               actor           The actor is whom executes the command.
   * @param   {AssetIdentifier}             governAssetId   The organization's governance asset identifier.
   * @param   {string}                      contract        The digital contract name. (e.g. "CreateVote").
   * @param   {TransactionParameters}       parameters      The transaction parameters (network specific).
   * @param   {Array<ContractOption>}       argv            The contract execution options (arguments).
   * @return  {Promise<TransactionURI>}
   **/
  execute(
    actor: PublicAccount,
    assetId: AssetIdentifier,
    contract: string,
    parameters: TransactionParameters,
    argv: ContractOption[],
  ): Promise<TransactionURI<Transaction>>
}
