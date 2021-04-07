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
  SecretProofTransaction,
  TransactionType,
  TransferTransaction,
} from 'symbol-sdk'

// internal dependencies
import { AssetIdentifier } from '../models/AssetIdentifier';
import { Context } from '../kernel/Context';
import { Service } from '../kernel/Service'

/**
 * @class AgreementService
 * @package Governable
 * @subpackage Services
 * @since v1.0.0
 * @description Class that describes a service to facilitate the
 *              handling and processes with launching DAOs.
 */
export class AgreementService extends Service {
  /**
   * @function Governable.AgreementService.verifyAuthenticity()
   * @static
   * @access public
   * @description Helper function to verify the authenticity of a
   *              DAO launch,  and whether it was commited to and
   *              confirmed by the network.
   *
   * @param   {AggregateTransaction}    agreementTx    The aggregate transaction created during a `CommitAgreement` contract execution.
   * @return  {boolean}
   */
  public static verifyAuthenticity(
    context: Context,
    identifier: AssetIdentifier,
    agreementTx: AggregateTransaction
  ): boolean {
    // - Must be an aggregate transaction
    if (!agreementTx || agreementTx.type !== TransactionType.AGGREGATE_BONDED) {
      return false
    }

    // - Must have embedded transactions
    if (!agreementTx.innerTransactions.length) {
      return false;
    }
    // - Must have exactly 3 embedded transactions
    else if (agreementTx.innerTransactions.length !== 3) {
      return false;
    }
    // - Transaction MUST be confirmed by the network
    else if (!agreementTx.transactionInfo) {
      return false;
    }

    // - Read embedded transactions details
    const secretProof = agreementTx.innerTransactions[0] as SecretProofTransaction
    const targetAgree = agreementTx.innerTransactions[1] as TransferTransaction
    const execProof = agreementTx.innerTransactions[2] as TransferTransaction

    // - Prepare `CommitAgreement` descriptor
    const commitDescriptor = (
      'Governable(v' + context.revision + ')' 
      + ':commit-agreement:' 
      + identifier.id
    )

    // - Verifies the information present in the agreement transaction
    // 1) proof must be the asset identifier
    // 2) target account agreement should refer to correct target
    // 3) execution proof transaction must be present
    return secretProof.proof === identifier.id
        && targetAgree.message.payload === identifier.target.publicKey
        && execProof.message.payload === commitDescriptor
  }
}
