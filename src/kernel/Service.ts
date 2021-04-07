/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */

// internal dependencies
import { Context } from '../../index'

/**
 * @class Service
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Abstract class that describes a service interface for
 *              low-level blockchain feature integrations.
 */
export abstract class Service {
  /**
   * Construct a service object around `context`
   *
   * @param {Context} context 
   */
  public constructor(
    /**
     * @description Execution context
     */
    protected readonly context: Context,
  ) {}
}
