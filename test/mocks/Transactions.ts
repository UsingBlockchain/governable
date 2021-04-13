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
  Deadline,
  InnerTransaction,
  TransferTransaction,
  MosaicDefinitionTransaction,
  TransactionType,
  Transaction,
} from 'symbol-sdk'

// internal dependencies
import { getTestAccount } from './Accounts'

export const getTestAggregateTransaction = (
  transactions: InnerTransaction[] = []
): AggregateTransaction => {
  return AggregateTransaction.createComplete(
    Deadline.create(1),
    transactions,
    getTestAccount('operator1').address.networkType,
    [],
  )
}

export const getTestTransaction = (
  type: TransactionType = TransactionType.TRANSFER
): Transaction => {
  return { type } as Transaction
}
