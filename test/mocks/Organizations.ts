/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import {
  MosaicId,
  NetworkType,
  PublicAccount,
} from 'symbol-sdk'

// internal dependencies
import { getTestMnemonic } from './Accounts'
import { Contract, ContractOption, Context, Governable, Symbol, TransactionParameters } from '../../index'

const mnemonic = getTestMnemonic()
const seedHash = 'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4'

export class FakeOrganization extends Governable.DistributedOrganization {
  public fakeGetContext(
    actor: PublicAccount,
    params: TransactionParameters = new TransactionParameters(),
    argv?: ContractOption[],
  ): Context {
    return this.getContext(
      actor,
      params,
      argv,
    )
  }

  public fakeGetContract(
    Contract: string,
    context: Context,
  ): Contract {
    return this.getContract(
      getTestOrganization().identifier,
      Contract,
      context,
    )
  }
}

export const getTestOrganization = (
  agreementHash?: string,
): FakeOrganization => {
  return new FakeOrganization(
    'SWP:XYM',
    new Symbol.Reader(
      'http://api-01.us-west-1.symboldev.network:3000',
      NetworkType.TEST_NET,
      seedHash,
      1573430400,
      new MosaicId('519FC24B9223E0B4'),
      'DummyNodePublicKey',
    ),
    new Symbol.Signer(),
    mnemonic,
    '', // password
    agreementHash,
  )
}
