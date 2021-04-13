/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
/**
 * @class SemanticRuleset
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Interface that describes a semantics ruleset.
 */
export interface SemanticRuleset {
  bundleWith: number[],
  repeatable: boolean,
  minOccurences: number,
  maxOccurences: number,
}

/**
 * @class SemanticsMap
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Class that describes indexed semantic rulesets.
 */
export class SemanticsMap extends Map<number, SemanticRuleset> {}
