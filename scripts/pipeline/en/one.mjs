#!/usr/bin/env node
/**
 * one.mjs — print a single plan entry (by slug or 1-based n) for a writer.
 *   node scripts/pipeline/en/one.mjs <slug|n>
 * Gives the agent everything it needs without re-reading the whole plan.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const plan = JSON.parse(readFileSync(path.join(here, 'plan.json'), 'utf8')).plan
const arg = process.argv[2]
if (!arg) { console.log('usage: one.mjs <slug|n>'); process.exit(1) }
const e = plan.find((x) => x.slug === arg) || plan[Number(arg) - 1]
if (!e) { console.log('no plan entry for: ' + arg); process.exit(1) }
console.log(JSON.stringify(e, null, 2))
