/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

// errors
export { FailureContractExecution } from './src/errors/FailureContractExecution'
export { FailureEmptyContract } from './src/errors/FailureEmptyContract'
export { FailureInvalidContract } from './src/errors/FailureInvalidContract'
export { FailureInvalidDerivationPath } from './src/errors/FailureInvalidDerivationPath'
export { FailureMissingArgument } from './src/errors/FailureMissingArgument'
export { FailureOperationForbidden } from './src/errors/FailureOperationForbidden'
export { FailureInvalidAgreement } from './src/errors/FailureInvalidAgreement'

// kernel
export { Context } from './src/kernel/Context'
export { Contract } from './src/kernel/Contract'
export { Service } from './src/kernel/Service'
export { BaseContract } from './src/kernel/BaseContract'
export { Organization } from './src/kernel/Organization'
export { Reader } from './src/kernel/Reader'
export { KeyProvider } from './src/kernel/KeyProvider'

// models
export { AllowanceResult } from './src/models/AllowanceResult'
export { AssetSource } from './src/models/AssetSource'
export { AssetIdentifier } from './src/models/AssetIdentifier'
export { ContractOption } from './src/models/ContractOption'
export { TransactionParameters } from './src/models/TransactionParameters'
export { MetadataBucket } from './src/models/MetadataBucket'

// adapters: exports one class `Reader`, one class `Signer`,
// and one class `Accountable` per each blockchain adapter.
import * as Symbol from './src/adapters/Symbol';
export { Symbol }

// export open standard namespace `Governable`
import * as Governable from './src/Governable'
export { Governable }
