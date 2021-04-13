/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

 import {
  Deadline,
  MosaicId,
} from 'symbol-sdk'

// internal dependencies
import { getTestAccount } from './Accounts'
import { Context, TransactionParameters, Symbol } from '../../index'

export const getTestContext = (
  nodeUrl: string,
  actor?: string,
  revision: number = 1,
): Context => {
  return new Context(
    revision,
    getTestAccount(actor || 'operator1'),
    new Symbol.Reader(
      nodeUrl,
      getTestAccount('operator1').address.networkType,
      'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4',
      1573430400,
      new MosaicId('519FC24B9223E0B4'),
      'DummyNodePublicKey',
    ),
    new Symbol.Signer(),
    new TransactionParameters(
      1573430400,
      Deadline.create(1573430400),
      undefined, // maxFee
    ),
    undefined,
  )
}
