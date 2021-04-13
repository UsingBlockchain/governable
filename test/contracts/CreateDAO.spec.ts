/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
 import { expect } from 'chai'
 import { describe, it, before } from 'mocha'
 import {
   AggregateTransaction,
   Transaction,
   TransferTransaction,
   SecretProofTransaction,
   MultisigAccountModificationTransaction,
   MosaicDefinitionTransaction,
   MosaicSupplyChangeTransaction,
   MosaicSupplyChangeAction,
   AccountMosaicRestrictionTransaction,
   MosaicAddressRestrictionTransaction,
   KeyGenerator,
 } from 'symbol-sdk'
 import { TransactionURI } from 'symbol-uri-scheme'
 
 // internal dependencies
 import {
   FailureMissingArgument,
   FailureOperationForbidden,
   Governable,
} from '../../index'
import {
  getTestAccount,
  getTestAggregateTransaction,
  getTestMosaicInfo,
  getTestOrganization,
} from '../mocks/index'
import { CreateDAO } from '../../src/contracts/CreateDAO'
import { ContractOption } from '../../src/models/ContractOption'

// prepare
const seedHash = 'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4'
const organisation = getTestOrganization()

// prepare some "expected" results
const testOperations = [getTestAccount('operator1'), getTestAccount('operator2')]
const testTargetAddr = 'TD4YEJJUQ7HBDWF5LRLUUBE6CI7OS7OEN3USJ3I' // m/44'/4343'/0'/0'/0'
const testAgreesAddr = 'TBJTHKVZEC563PFLZPNYG2LYY6LU4X2MLN2HJKA' // m/44'/4343'/5'/0'/0'
const testMosaicsIds = organisation.identifier.toMosaicId().toHex()
const testIdentifier = '9e03faed'
const testMetaValues = new Governable.OrganizationMetadata(
  'dummy',
  '101',
  'https://governable.symbol.ninja',
  'Anonymous',
  'An anonymous dummy autonomous organization',
  'https://governable.symbol.ninja/logo-governable.png'
)

// "actor" this time is one of the operators
const emptyContext = organisation.fakeGetContext(getTestAccount('operator1'))
const validContext = organisation.fakeGetContext(getTestAccount('operator1'), undefined, [
  new ContractOption('target', organisation.target),
  new ContractOption('operators', testOperations),
  new ContractOption('metadata', testMetaValues)
])
const invalidContext = organisation.fakeGetContext(getTestAccount('operator1'), undefined, [
  new ContractOption('target', getTestAccount('target')), // intentionally different ("invalid")
  new ContractOption('operators', testOperations),
  new ContractOption('metadata', testMetaValues)
])

// prepare one empty contract
const noArgsContract = new CreateDAO(emptyContext, organisation.identifier)

describe('contracts/CreateDAO --->', () => {
  describe('constructor() should', () => {
    it('use correct target public account', () => {
      expect(noArgsContract.context.revision).to.be.equal(Governable.Revision)
      expect(noArgsContract.target.address.plain()).to.be.equal(testTargetAddr)
    })
  })

  describe('name() should', () => {
    it('return correct name', () => {
      expect(noArgsContract.name).to.be.equal('CreateDAO')
    })
  })

  describe('descriptor() should', () => {
    it('contain revision and identifier', () => {
      expect(noArgsContract.descriptor).to.be.equal(
        'Governable(v' + Governable.Revision + '):create-dao:' + testIdentifier
      )
    })
  })

  describe('CreateDAO extends Executable --->', () => {
    let newContract: CreateDAO,
        resultTxURI: TransactionURI<Transaction>
    before(() => {
      newContract = new CreateDAO(validContext, organisation.identifier)
      newContract.agreement = getTestAggregateTransaction()
      resultTxURI = newContract.execute(getTestAccount('operator1'), [
        new ContractOption('target', organisation.target),
        new ContractOption('operators', testOperations),
        new ContractOption('metadata', testMetaValues)
      ])
    })

    describe('canExecute() should', () => {
      it('throw on missing mandatory argument', () => {
        expect(() => {
          const auth = noArgsContract.canExecute(getTestAccount('target'))
        }).to.throw(FailureMissingArgument)
      })

      it('disallow execution to all given wrong target account', () => {
        const failContract = new CreateDAO(invalidContext, organisation.identifier)
        const authFails = failContract.canExecute(getTestAccount('operator1'))
        expect(authFails.status).to.be.equal(false)
      })

      it('disallow execution to all given no agreement', () => {
        const failContract = new CreateDAO(validContext, organisation.identifier)
        const authFails = failContract.canExecute(getTestAccount('operator1'))
        expect(authFails.status).to.be.equal(false)
      })

      it('allow execution given agreement and correct target', () => {
        const auth = newContract.canExecute(getTestAccount('operator1'))
        expect(auth.status).to.be.equal(true)
      })
    })

    describe('execute() should', () => {
      it('throw on missing mandatory argument', () => {
        expect(() => {
          const uri = noArgsContract.execute(getTestAccount('target'))
        }).to.throw(FailureMissingArgument)
      })

      it('return a transaction URI', () => {
        expect(resultTxURI).to.be.instanceof(TransactionURI)
      })
    })
  })

  describe('URI.toTransaction() should', () => {
    let newContract: CreateDAO,
        resultTxURI: TransactionURI<Transaction>,
        transaction: Transaction
    before(() => {
      newContract = new CreateDAO(validContext, organisation.identifier)
      newContract.agreement = getTestAggregateTransaction()
      resultTxURI = newContract.execute(getTestAccount('operator1'), [
        new ContractOption('target', organisation.target),
        new ContractOption('operators', testOperations),
        new ContractOption('metadata', testMetaValues)
      ])
      transaction = resultTxURI.toTransaction()
    })

    it('contain 1 aggregate transaction', () => {
      expect(transaction).to.be.instanceof(AggregateTransaction)
    })

    it('contain 18 embedded transactions given full with 2 operators', () => {
      const aggregate = transaction as AggregateTransaction
      expect(aggregate.innerTransactions.length).to.be.equal(19)
    })

    it('contain correct sequence of embedded transactions', () => {
      const aggregate = transaction as AggregateTransaction
      expect(newContract.specification.validate(aggregate)).to.be.equal(true)
    })

    it('use correct operators addresses in multi-signature', () => {
      const aggregate = transaction as AggregateTransaction
      const multisigTx = aggregate.innerTransactions[0] as MultisigAccountModificationTransaction

      expect(multisigTx.addressAdditions.length).to.be.equal(2)
      expect(multisigTx.addressAdditions[0].plain()).to.be.equal(getTestAccount('operator1').address.plain())
      expect(multisigTx.addressAdditions[1].plain()).to.be.equal(getTestAccount('operator2').address.plain())
    })

    it('use correct mosaicId in mosaic definition', () => {
      const aggregate = transaction as AggregateTransaction
      const mosaicDefTx = aggregate.innerTransactions[1] as MosaicDefinitionTransaction

      expect(mosaicDefTx.mosaicId.toHex()).to.be.equal(organisation.identifier.toMosaicId().toHex())
    })

    it('use correct supply in mosaic supply change given 2 operators', () => {
      const aggregate = transaction as AggregateTransaction
      const mosaicSupplyTx = aggregate.innerTransactions[2] as MosaicSupplyChangeTransaction

      expect(mosaicSupplyTx.mosaicId.toHex()).to.be.equal(organisation.identifier.toMosaicId().toHex())
      expect(mosaicSupplyTx.action).to.be.equal(MosaicSupplyChangeAction.Increase)
      expect(mosaicSupplyTx.delta.compact()).to.be.equal(testOperations.length) // numOperators
    })

    it('restrict target address to using governance mosaic and fee mosaic', () => {
      const aggregate = transaction as AggregateTransaction
      const accountMosaicResTx = aggregate.innerTransactions[3] as AccountMosaicRestrictionTransaction

      expect(accountMosaicResTx.restrictionAdditions.length).to.be.equal(2)
      expect(accountMosaicResTx.restrictionAdditions[0].toHex()).to.be.equal(organisation.identifier.toMosaicId().toHex())
      expect(accountMosaicResTx.restrictionAdditions[1].toHex()).to.be.equal(organisation.reader.feeMosaicId.toHex())
    })

    it('repeat operators User_Role restriction and governance mosaic assignment', () => {
      const aggregate = transaction as AggregateTransaction
      for (let i = 0, m = testOperations.length; i < m; i++) {
        const addressRestrictTx = aggregate.innerTransactions[14 + (i*2)] as MosaicAddressRestrictionTransaction
        const transferTx = aggregate.innerTransactions[15 + (i*2)] as TransferTransaction
        expect(addressRestrictTx.restrictionKey.toHex()).to.be.equal(KeyGenerator.generateUInt64Key('User_Role').toHex())
        expect(addressRestrictTx.targetAddress.plain()).to.be.equal(testOperations[i].address.plain())
        expect(transferTx.recipientAddress.plain()).to.be.equal(testOperations[i].address.plain())
      }
    })

    it('contain correct descriptor as execution proof', () => {
      const aggregate = transaction as AggregateTransaction
      const transferTx = aggregate.innerTransactions[18] as TransferTransaction

      expect(transferTx.message.payload).to.be.equal(newContract.descriptor)
      expect(transferTx.recipientAddress.plain()).to.be.equal(testTargetAddr)
    })
  })
})
