/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
 import {
  AggregateTransactionInfo,
  Transaction,
  TransactionGroup,
  TransactionInfo,
} from 'symbol-sdk'

// internal dependencies
import { Service } from '../kernel/Service'
import * as Symbol from '../adapters/Symbol'

/**
 * @class TransactionService
 * @package Governable
 * @subpackage Services
 * @since v1.0.0
 * @description Class that describes a service to facilitate the
 *              handling and processes with multi-signature accounts.
 */
export class TransactionService extends Service {
  /**
   * @function Governable.TransactionService.readTransactionFromNetwork()
   * @access public
   * @description Gets transaction information given a transaction hash.
   *
   * @param   {string}  hash              The transaction hash
   * @returns {Transaction | undefined}   The transaction or nothing.
   */
  public async readTransactionFromNetwork(
    hash: string,
  ): Promise<Transaction | undefined> {
    const factory = (this.context.reader as Symbol.Reader).factoryHttp
    return await factory.createTransactionRepository().getTransaction(
      hash, TransactionGroup.Confirmed
    ).toPromise()
  }

  /**
   * @function Governable.TransactionService.getTransactionHash()
   * @static
   * @access public
   * @description Gets a transaction's hash. If it is an aggregate transaction,
   *              returns the aggregate transaction hash (merkle root hash).
   *
   * @param transaction Transaction.
   * @returns string | undefined
   */
  public static getTransactionHash(
    transaction: Transaction,
  ): string | undefined {
    const transactionInfo = transaction.transactionInfo;
    if (transactionInfo instanceof AggregateTransactionInfo) {
      return transactionInfo.aggregateHash;
    }
    else if (transactionInfo instanceof TransactionInfo) {
      return transactionInfo.hash;
    }

    return undefined
  }
}
