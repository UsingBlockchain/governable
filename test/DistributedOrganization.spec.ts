/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
import * as sinon from 'sinon'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { of } from 'rxjs'
import { Network } from 'symbol-hd-wallets'
import { AccountInfo } from 'symbol-sdk'

// internal dependencies
import {
  BaseContract,
  ContractOption,
  FailureInvalidContract,
  Governable,
  Symbol,
  TransactionParameters,
} from '../index'
import { getTestAccount, getTestAccountInfo, getTestOrganization, Stubs } from './mocks/index'

// prepare
const seedHash = 'ACECD90E7B248E012803228ADB4424F0D966D24149B72E58987D2BF2F2AF03C4'
const organisation = getTestOrganization()
const target = getTestAccount('target')
const testIdentifier = '9e03faed'
const defaultTarget = 'TD4YEJJUQ7HBDWF5LRLUUBE6CI7OS7OEN3USJ3I' // m/44'/4343'/0'/0'/0'

describe('DistributedOrganization --->', () => {
  describe('constructor() should', () => {
    it('derive correct DAO target account', () => {
      expect(organisation.target.address.plain()).to.be.equal(defaultTarget)
    })

    it('use correct asset source', () => {
      expect(organisation.source.source).to.be.equal(seedHash)
      expect(organisation.source.network).to.be.equal(Network.CATAPULT_PUBLIC)
    })
  })

  describe('identifier() should', () => {
    it('derive correct DAO assets identifier', () => {
      expect(organisation.identifier.id).to.be.equal(testIdentifier)
      expect(organisation.identifier.target.address.plain()).to.be.equal(defaultTarget)
    })
  })

  describe('getContext() should', () => {
    it('use correct Revision', () => {
      const c = organisation.fakeGetContext(target)
      expect(c.revision).to.be.equal(Governable.Revision)
    })

    it('use correct Reader implementation', () => {
      const c = organisation.fakeGetContext(target)
      expect(c.reader).to.be.instanceof(Symbol.Reader)
      expect((c.reader as Symbol.Reader).generationHash).to.be.equal(seedHash)
    })

    it('use correct Signer implementation', () => {
      const c = organisation.fakeGetContext(target)
      expect(c.signer).to.be.instanceof(Symbol.Signer)
      expect((c.signer as Symbol.Signer).keyChain.curve).to.be.equal(Network.CATAPULT_PUBLIC.curve)
    })

    it('permit overwrite of transaction parameters', () => {
      const c = organisation.fakeGetContext(target, new TransactionParameters(1234))
      expect(c.parameters).to.be.instanceof(TransactionParameters)
      expect(c.parameters.epochAjustment).to.be.equal(1234)
    })

    it('permit overwrite of contract options', () => {
      const c = organisation.fakeGetContext(target, new TransactionParameters(), [
        new ContractOption('dummy', 'value')
      ])
      expect(c.getInput('dummy', null)).to.not.be.null
      expect(c.getInput('dummy', null)).to.be.equal('value')
    })
  })

  describe('getContract() should', () => {
    it ('throw an error on unknown contract', () => {
      const context = organisation.fakeGetContext(target)
      expect(() => {
        const command = organisation.fakeGetContract('unknown', context)
      }).to.throw(FailureInvalidContract)
    })

    it('use correct Context for execution', () => {
      const context = organisation.fakeGetContext(target)
      const command = organisation.fakeGetContract('CreateDAO', context)
      expect(command.context.actor.publicKey).to.be.equal(target.publicKey)
      expect(command.context.revision).to.be.equal(Governable.Revision)
    })

    it('use correct distributed organization contract', () => {
      const context = organisation.fakeGetContext(target)
      const command = organisation.fakeGetContract('CreateDAO', context)
      expect(command).to.be.instanceof(BaseContract)
      expect(command.name).to.be.equal('CreateDAO')
    })
  })

  describe('synchronize() should', () => {
    it('exist and execute', async () => {
      // - Prepare
      const mockOrg = sinon.mock(organisation)
      const stubSynchronize = mockOrg.expects('synchronize').once()

      // - Act
      await organisation.synchronize()

      // - Assert
      expect(stubSynchronize.calledOnce).to.be.true
    })

    it('get correct mosaic information', async () => {
      // - Prepare
      const context = organisation.fakeGetContext(target)
      const factory = (context.reader as Symbol.Reader).factoryHttp
      const stubMosaics = new Stubs.MosaicRepository('http://localhost:3000')
      const stubRepository = sinon.stub(factory, 'createMosaicRepository').returns(stubMosaics)
      const stubMosaicInfo = of(new Stubs.MosaicInfo(organisation.identifier.toMosaicId()))
      const repository = factory.createMosaicRepository()
      const stubGetMosaic = sinon.stub(repository, 'getMosaic').returns(stubMosaicInfo)

      // - Act
      const mosaicId: Stubs.MosaicInfo = await repository.getMosaic(organisation.identifier.toMosaicId()).toPromise()
      const expectId: Stubs.MosaicInfo = await stubMosaicInfo.toPromise()

      // - Assert
      expect(stubRepository.calledOnce).to.be.true
      expect(stubGetMosaic.calledOnce).to.be.true
      expect(mosaicId.id.toHex()).to.be.equal(expectId.id.toHex())
    })

    it('get correct account information', async () => {
      // - Prepare
      const context = organisation.fakeGetContext(target)
      const factory = (context.reader as Symbol.Reader).factoryHttp
      const stubAccounts = new Stubs.AccountRepository('http://localhost:3000')
      const stubRepository = sinon.stub(factory, 'createAccountRepository').returns(stubAccounts)
      const stubAccountInfo = of(getTestAccountInfo('target'))
      const repository = factory.createAccountRepository()
      const stubGetAccountInfo = sinon.stub(repository, 'getAccountInfo').returns(stubAccountInfo)

      // - Act
      const accountInfo: AccountInfo = await repository.getAccountInfo(target.address).toPromise()

      // - Assert
      expect(stubRepository.calledOnce).to.be.true
      expect(stubGetAccountInfo.calledOnce).to.be.true
      expect(accountInfo.address.plain()).to.be.equal(target.address.plain())
    })
  })
})
 