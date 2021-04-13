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
} from 'symbol-sdk'
import { TransactionURI } from 'symbol-uri-scheme'

// internal dependencies
import { FailureMissingArgument, FailureOperationForbidden, Governable } from '../../index'
import {
  getTestAccount,
  getTestAggregateTransaction,
  getTestOrganization,
} from '../mocks/index'
import { CommitAgreement } from '../../src/contracts/CommitAgreement'
import { ContractOption } from '../../src/models/ContractOption'

// prepare
const seedHash = 'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4'
const organisation = getTestOrganization()

// "actor" this time is one of the operators
const emptyContext = organisation.fakeGetContext(getTestAccount('operator1'))
const validContext = organisation.fakeGetContext(getTestAccount('operator1'), undefined, [
  new ContractOption('target', organisation.target),
  new ContractOption('agreement', getTestAccount('agreement')),
])
const invalidContext = organisation.fakeGetContext(getTestAccount('operator1'), undefined, [
  new ContractOption('target', getTestAccount('target')), // intentionally different ("invalid")
  new ContractOption('agreement', getTestAccount('agreement')),
])

// prepare some "expected" results
const testOperations = [getTestAccount('operator1'), getTestAccount('operator2')]
const testTargetAddr = 'TD4YEJJUQ7HBDWF5LRLUUBE6CI7OS7OEN3USJ3I' // m/44'/4343'/0'/0'/0'
const testAgreesAddr = 'TBJTHKVZEC563PFLZPNYG2LYY6LU4X2MLN2HJKA' // m/44'/4343'/5'/0'/0'
const testIdentifier = '9e03faed'
const testSecretHash = '3f22abcf45a4483aca06ec519cb5c62948e823828ced3477de4b9aca42b7ebf0'.toUpperCase()

// prepare one empty contract
const noArgsContract = new CommitAgreement(emptyContext, organisation.identifier)

describe('contracts/CommitAgreement --->', () => {
  describe('constructor() should', () => {
    it('use correct target public account', () => {
      expect(noArgsContract.context.revision).to.be.equal(Governable.Revision)
      expect(noArgsContract.target.address.plain()).to.be.equal(testTargetAddr)
    })
  })

  describe('name() should', () => {
    it('return correct name', () => {
      expect(noArgsContract.name).to.be.equal('CommitAgreement')
    })
  })

  describe('descriptor() should', () => {
    it('contain revision and identifier', () => {
      expect(noArgsContract.descriptor).to.be.equal(
        'Governable(v' + Governable.Revision + '):commit-agreement:' + testIdentifier
      )
    })
  })

  describe('CommitAgreement extends Executable --->', () => {
    let newContract: CommitAgreement,
        resultTxURI: TransactionURI<Transaction>
    before(() => {
      newContract = new CommitAgreement(validContext, organisation.identifier)
      newContract.operators = testOperations.map(o => o.address)
      resultTxURI = newContract.execute(getTestAccount('operator1'), [
        new ContractOption('target', organisation.target),
        new ContractOption('agreement', getTestAccount('agreement')),
      ])
    })

    describe('canExecute() should', () => {
      it('throw on missing mandatory argument', () => {
        expect(() => {
          const auth = noArgsContract.canExecute(getTestAccount('target'))
        }).to.throw(FailureMissingArgument)
      })

      it('disallow execution to all given wrong target account', () => {
        const failContract = new CommitAgreement(invalidContext, organisation.identifier)
        const authFails = failContract.canExecute(getTestAccount('operator1'))
        expect(authFails.status).to.be.equal(false)
      })

      it('disallow execution to all given agreement is set', () => {
        const failContract = new CommitAgreement(validContext, organisation.identifier)
        failContract.agreement = getTestAggregateTransaction()
        failContract.operators = testOperations.map(o => o.address)

        const authFails = failContract.canExecute(getTestAccount('operator1'))
        expect(authFails.status).to.be.equal(false)
      })

      it('allow execution given no agreement and correct target', () => {
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
    let newContract: CommitAgreement,
        resultTxURI: TransactionURI<Transaction>,
        transaction: Transaction
    before(() => {
      newContract = new CommitAgreement(validContext, organisation.identifier)
      newContract.operators = testOperations.map(o => o.address)
      resultTxURI = newContract.execute(getTestAccount('operator1'), [
        new ContractOption('target', organisation.target),
        new ContractOption('agreement', getTestAccount('agreement')),
      ])
      transaction = resultTxURI.toTransaction()
    })

    it('contain 1 aggregate transaction', () => {
      expect(transaction).to.be.instanceof(AggregateTransaction)
    })

    it('contain 3 embedded transactions', () => {
      const aggregate = transaction as AggregateTransaction
      expect(aggregate.innerTransactions.length).to.be.equal(3)
    })

    it('contain correct sequence of embedded transactions', () => {
      const aggregate = transaction as AggregateTransaction
      expect(newContract.specification.validate(aggregate)).to.be.equal(true)
    })

    it('use hashed identifier in secret proof', () => {
      const aggregate = transaction as AggregateTransaction
      const secretProofTx = aggregate.innerTransactions[0] as SecretProofTransaction

      expect(secretProofTx.secret).to.be.equal(testSecretHash)
      expect(secretProofTx.recipientAddress.plain()).to.be.equal(testTargetAddr)
    })

    it('describe agreed upon target public key', () => {
      const aggregate = transaction as AggregateTransaction
      const transferTx = aggregate.innerTransactions[1] as TransferTransaction

      expect(transferTx.message.payload).to.be.equal(newContract.target.publicKey)
      expect(transferTx.recipientAddress.plain()).to.be.equal(testAgreesAddr)
    })

    it('contain correct descriptor as execution proof', () => {
      const aggregate = transaction as AggregateTransaction
      const transferTx = aggregate.innerTransactions[2] as TransferTransaction

      expect(transferTx.message.payload).to.be.equal(newContract.descriptor)
      expect(transferTx.recipientAddress.plain()).to.be.equal(testAgreesAddr)
    })
  })
})
 