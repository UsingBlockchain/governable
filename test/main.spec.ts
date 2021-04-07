/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

import {expect} from 'chai'
import {describe, it} from 'mocha'

// internal dependencies
import * as Lib from '../index'

describe('main should', () => {
  it('export Governable.DistributedOrganization', () => {
    expect(Lib.Governable.DistributedOrganization).not.to.be.undefined
  })
})
