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
  MultisigAccountModificationTransaction,
  SecretLockTransaction,
  TransferTransaction,
} from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import { FailureMissingArgument, Governable } from '../../index'
import {
  getTestAccount,
  getTestAggregateTransaction,
  getTestMnemonic,
  getTestOrganization,
} from '../mocks/index'
import { CreateAgreement } from '../../src/contracts/CreateAgreement'
import { ContractOption } from '../../src/models/ContractOption'

// prepare
const seedHash = 'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4'
const organisation = getTestOrganization()
const orgPreAgreed = getTestOrganization('fakeAgreementTransactionHash')
const emptyContext = organisation.fakeGetContext(organisation.target)
const validContext = organisation.fakeGetContext(organisation.target, undefined, [
  new ContractOption('password', ''),
  new ContractOption('mnemonic', getTestMnemonic()),
  new ContractOption('agreementPath', 'm/44\'/4343\'/5\'/0\'/0\''),
  new ContractOption('operators', [
    getTestAccount('operator1'),
    getTestAccount('operator2')
  ]),
])

// prepare some "expected" results
const testTargetAddr = 'TD4YEJJUQ7HBDWF5LRLUUBE6CI7OS7OEN3USJ3I' // m/44'/4343'/0'/0'/0'
const testAgreesAddr = 'TBJTHKVZEC563PFLZPNYG2LYY6LU4X2MLN2HJKA' // m/44'/4343'/5'/0'/0'
const testIdentifier = '9e03faed'
const testSecretHash = '3f22abcf45a4483aca06ec519cb5c62948e823828ced3477de4b9aca42b7ebf0'.toUpperCase()

// prepare one empty contract
const noArgsContract = new CreateAgreement(emptyContext, organisation.identifier)

describe('contracts/CreateAgreement --->', () => {
  describe('constructor() should', () => {
    it('use correct target public account', () => {
      expect(noArgsContract.context.revision).to.be.equal(Governable.Revision)
      expect(noArgsContract.target.address.plain()).to.be.equal(testTargetAddr)
    })
  })

  describe('name() should', () => {
    it('return correct name', () => {
      expect(noArgsContract.name).to.be.equal('CreateAgreement')
    })
  })

  describe('descriptor() should', () => {
    it('contain revision and identifier', () => {
      expect(noArgsContract.descriptor).to.be.equal(
        'Governable(v' + Governable.Revision + '):create-agreement:' + testIdentifier
      )
    })
  })

  describe('CreateAgreement extends Executable --->', () => {
    let newContract: CreateAgreement,
        resultTxURI: TransactionURI<Transaction>
    before(() => {
      newContract = new CreateAgreement(validContext, organisation.identifier)
      resultTxURI = newContract.execute(getTestAccount('target'), [
        new ContractOption('password', ''),
        new ContractOption('mnemonic', getTestMnemonic()),
        new ContractOption('agreementPath', 'm/44\'/4343\'/5\'/0\'/0\''),
        new ContractOption('operators', [
          getTestAccount('operator1'),
          getTestAccount('operator2')
        ]),
      ])
    })

    describe('canExecute() should', () => {
      it('throw on missing mandatory argument', () => {
        expect(() => {
          const auth = noArgsContract.canExecute(getTestAccount('target'))
        }).to.throw(FailureMissingArgument)
      })

      it('allow execution to all given no agreement', () => {
        const auth = newContract.canExecute(getTestAccount('target'))
        expect(auth.status).to.be.equal(true)
      })

      it('disallow execution to all given agreement is set', () => {
        const failContract = new CreateAgreement(validContext, orgPreAgreed.identifier)
        failContract.agreement = getTestAggregateTransaction()
        const auth = failContract.canExecute(getTestAccount('target'))
        expect(auth.status).to.be.equal(false)
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
    let newContract: CreateAgreement,
        resultTxURI: TransactionURI<Transaction>,
        transaction: Transaction
    before(() => {
      newContract = new CreateAgreement(validContext, organisation.identifier)
      resultTxURI = newContract.execute(getTestAccount('target'), [
        new ContractOption('password', ''),
        new ContractOption('mnemonic', getTestMnemonic()),
        new ContractOption('agreementPath', 'm/44\'/4343\'/5\'/0\'/0\''),
        new ContractOption('operators', [
          getTestAccount('operator1'),
          getTestAccount('operator2')
        ]),
      ])
      transaction = resultTxURI.toTransaction()
    })

    it('contain 1 aggregate transaction', () => {
      expect(transaction).to.be.instanceof(AggregateTransaction)
    })

    it('contain 4 embedded transactions', () => {
      const aggregate = transaction as AggregateTransaction
      expect(aggregate.innerTransactions.length).to.be.equal(4)
    })

    it('contain correct sequence of embedded transactions', () => {
      const aggregate = transaction as AggregateTransaction
      expect(newContract.specification.validate(aggregate)).to.be.equal(true)
    })

    it('use correct multi-signature configuration (+2:-1)', () => {
      const aggregate = transaction as AggregateTransaction
      const multisigTx = aggregate.innerTransactions[0] as MultisigAccountModificationTransaction

      expect(multisigTx.addressDeletions.length).to.be.equal(0)
      expect(multisigTx.addressAdditions.length).to.be.equal(2)
      expect(multisigTx.minApprovalDelta).to.be.equal(2)
      expect(multisigTx.minRemovalDelta).to.be.equal(1)
    })

    it('use hashed identifier in secret lock', () => {
      const aggregate = transaction as AggregateTransaction
      const secretLockTx = aggregate.innerTransactions[1] as SecretLockTransaction

      expect(secretLockTx.secret).to.be.equal(testSecretHash)
      expect(secretLockTx.recipientAddress.plain()).to.be.equal(testTargetAddr)
    })

    it('describe agreed upon target public key', () => {
      const aggregate = transaction as AggregateTransaction
      const transferTx = aggregate.innerTransactions[2] as TransferTransaction

      expect(transferTx.message.payload).to.be.equal(newContract.target.publicKey)
      expect(transferTx.recipientAddress.plain()).to.be.equal(testAgreesAddr)
    })

    it('contain correct descriptor as execution proof', () => {
      const aggregate = transaction as AggregateTransaction
      const transferTx = aggregate.innerTransactions[3] as TransferTransaction

      expect(transferTx.message.payload).to.be.equal(newContract.descriptor)
      expect(transferTx.recipientAddress.plain()).to.be.equal(testAgreesAddr)
    })
  })
})
