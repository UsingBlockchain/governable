/**
 * This file is part of Governable shared under AGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     Governable
 * @author      Grégory Saive for Using Blockchain Ltd <greg@ubc.digital>
 * @license     AGPL-3.0
 */
// internal dependencies
import { AggregateTransaction, Transaction, TransactionType } from 'symbol-sdk';
import { TaxonomyMap, TaxonomyMapEntry } from './TaxonomyMap'
import { SemanticsMap, SemanticRuleset } from './SemanticsMap'

/**
 * @class Taxonomy
 * @package Governable
 * @subpackage Kernel
 * @since v1.0.0
 * @description Class that describes specifications for transaction
 *              sequences. This class serves as a ruleset to create
 *              valid/verifiable digital contracts using Symbol.
 */
export class Taxonomy {

  protected registeredTypes: number[] = []
  protected repeatableTypes: number[] = []

  /**
   * Construct a specification object
   *
   * @param   {string}  name  Name of the transaction taxonomy.
   */
  public constructor(
    /**
     * @access public
     * @description Name of the transaction taxonomy.
     */
    public name: string,

    /**
     * @access public
     * @description The minimal transaction sequence planning.
     * This property is used to define a list of required items
     * that will *always* be present in the resulting contract.
     */
    public sequence: TaxonomyMap = new TaxonomyMap(),

    /**
     * @access public
     * @description The potential semantic rulesets to further
     * qualify the transaction sequence planning. This is what
     * defines whether entries can be repeated, how many times
     * and in which subgroups an entry may appear.
     */
    public semantics: SemanticsMap = new SemanticsMap(),
  ) {
    this.registeredTypes = this.getTransactionTypes()
  }

  /**
   * Validates the content of \a contract aggregate transaction
   * by interpreting its' embedded transactions.
   *
   * @access public
   * @param   {PublicAccount}           actor
   * @param   {Array<ContractOption>}    argv
   * @return  {AllowanceResult}
   */
  public validate(
    contract: AggregateTransaction,
  ): boolean {
    // - Do not accept empty contracts
    if (! contract.innerTransactions.length) {
      return false
    }
    // - Do not accept empty sequences
    else if (!this.registeredTypes.length) {
      return  false
    }

    // - Prepares sequenced transactions loop
    const indexes = [...this.sequence.keys()],
          ctrTxes = contract.innerTransactions

    // console.log(this.name)
    // console.log("types: " + this.registeredTypes.join(','))
    // console.log("ctr=" + ctrTxes.map(t => t.type).join(','))

    // - Loops through *contract* to validate *types*.
    for (let i = 0, max = ctrTxes.length; i < max; i++) {
      const innerTx = ctrTxes[i]
      if (!this.acceptsType(innerTx.type)) {
        return false
      }
    }

    // - Loops through *sequence* to validate the *structure*.
    for (let i = 0, skip = 0, bundled = 0, max = indexes.length; i < max; i++) {
      // - Reads sequence information and semantics
      const entry = this.sequence.get(i) as TaxonomyMapEntry
      const rules = this.semantics.get(i) as SemanticRuleset

      // - Keeps track of required embedded transactions
      const cursor= i - skip + bundled

      let innerTx = cursor < ctrTxes.length
        ? ctrTxes[cursor]
        : null
      //console.log("c=" + cursor + ";skip=" + skip + ";b=" + bundled + ";et=" + entry.type + ";er=" + entry.required + ";tx=" + innerTx!.type)

      // - 1. Optional entries *can* appear
      if (false === entry.required) {
        if (!innerTx || innerTx.type !== entry.type)
          skip++

        continue
      }

      // - 2. Repeatable entries are validated in bundles
      else if (
        !!rules && rules.repeatable
      ) {
        // - Prepare the entries bundle
        let trxes = contract.innerTransactions.slice(cursor),
            bundle = [entry]
        for (let b = 1; b < rules.bundleWith.length; b++) {
          bundle.push(this.sequence.get(i + b)!)
        }

        // - Aggregate validation practice
        let numOccurences = 0
        if (! (numOccurences = this.validateBundle(bundle, trxes))) {
          return false
        }

        // - Move depending on bundle size
        i = i + bundle.length
        bundled += numOccurences * bundle.length
      }

      // - 3. Required entries *must* appear
      else if (
        !ctrTxes[cursor] || entry.type !== ctrTxes[cursor].type
      ) {
        return false
      }
    }

    return true
  }

  /**
   * This method validates the compliancy to \a entries bundles
   * of \a transactions. It will return the number of occurrences
   * of the *full* bundle that were found.
   *
   * @param   {TaxonomyMapEntry}  entries       The bundled sequence.
   * @param   {Transaction[]}     transactions  The transactions that may comply.
   * @return  {number}            The number of occurrences of given bundle.
   */
  public validateBundle(
    entries: TaxonomyMapEntry[],
    transactions: Transaction[]
  ): number {
    let isBundle: boolean = false,
        cntFound: number = 0

    do {
      const cursor = cntFound * entries.length
      for (let i = 0, m = entries.length; i < m; i++) {
        const bundled = entries[i]
        const innerTx = transactions[cursor + i]

        if (!innerTx || innerTx.type !== bundled.type) {
          isBundle = false
          break
        }
        else if (i === entries.length - 1) {
          isBundle = true
        }
      }

      if (isBundle) {
        cntFound++
      }
    }
    while (isBundle === true)

    return cntFound
  }

  /**
   * This method returns the unique transaction types
   * that must- or can be present in taxonomies which
   * comply to the current taxonomy.
   *
   * @access public
   * @return {number[]}   The alphabetically ordered number
   *                      representations of types. Using a
   *                      sequence the types are expressed:
   *                      e.g. transfer=16724, mosaic=16717
   */
  public getTransactionTypes(): number[] {
    let uniqTypes: {[key: number]: boolean} = {};

    [...this.sequence.values()].forEach(
      (cur, i, arr) => {
        if (!uniqTypes[cur.type]) uniqTypes[cur.type] = true
      }
    )

    return Object.keys(uniqTypes).map(k => parseInt(k))
  }

  /**
   * This method checks whether \a type is a registered
   * transaction type and whether contracts that comply
   * to this taxonomy do "accept" a specific type.
   *
   * @param   {TransactionType}   type 
   * @return  {boolean} 
   */
  public acceptsType(
    type: TransactionType | undefined
  ): boolean {
    return !!type 
      && this.registeredTypes.length > 0
      && this.registeredTypes.includes(type)
  }

  /**
   * This method adds \a type transaction type to the list
   * of repeatable transactions.
   *
   * @param   {TransactionType}   type 
   * @return  {boolean} 
   */
  public setAcceptsRepeat(
    type: TransactionType
  ): Taxonomy {
    if (! this.registeredTypes.includes(type)) {
      return this
    }

    if (! this.repeatableTypes.includes(type)) {
      this.repeatableTypes.push(type)
    }

    return this
  }

  /**
   * This method checks whether \a type is a repeatable
   * transaction type.
   *
   * @param   {TransactionType}   type 
   * @return  {boolean} 
   */
   public acceptsRepeat(
    type: TransactionType | undefined
  ): boolean {
    return !!type 
      && this.repeatableTypes.length > 0
      && this.repeatableTypes.includes(type)
  }
}
