import { Page } from '@playwright/test';
import * as path from 'path';

export interface A11yViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodeCount: number;
  sampleNodeHtml?: string;
}

export interface A11yScanResult {
  violations: A11yViolation[];
  passCount: number;
  incompleteCount: number;
}

export interface ScanOptions {
  include?: string[];
  exclude?: string[];
  tags?: string[];
  disableRules?: string[];
}

// axe-core result types (subset)
interface AxeNodeResult { html: string; }
interface AxeResult {
  id: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: AxeNodeResult[];
}
interface AxeRunResult {
  violations: AxeResult[];
  passes: AxeResult[];
  incomplete: AxeResult[];
}

/**
 * Injects axe-core into the page and runs an accessibility scan.
 * Equivalent to @axe-core/playwright but without the scoped package dependency.
 */
export async function runA11yScan(page: Page, options: ScanOptions = {}): Promise<A11yScanResult> {
  const axePath = require.resolve('axe-core');
  await page.addScriptTag({ path: path.resolve(axePath) });

  const results = await page.evaluate((opts: ScanOptions): Promise<AxeRunResult> => {
    const context: Record<string, string[]> = {};
    if (opts.include?.length) context['include'] = opts.include;
    if (opts.exclude?.length) context['exclude'] = opts.exclude;

    const runOptions: Record<string, unknown> = {};
    if (opts.tags?.length)         runOptions['runOnly'] = { type: 'tag', values: opts.tags };
    if (opts.disableRules?.length) runOptions['rules']   = Object.fromEntries(
      opts.disableRules.map(r => [r, { enabled: false }])
    );

    return (globalThis as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<AxeRunResult> } })
      .axe.run(Object.keys(context).length ? context : globalThis.document, runOptions);
  }, options);

  return {
    violations: results.violations.map(v => ({
      id:          v.id,
      impact:      v.impact ?? 'unknown',
      description: v.description,
      helpUrl:     v.helpUrl,
      nodeCount:   v.nodes.length,
      sampleNodeHtml: v.nodes[0]?.html,
    })),
    passCount:       results.passes.length,
    incompleteCount: results.incomplete.length,
  };
}

export function formatViolations(violations: A11yViolation[]): string {
  if (!violations.length) return '(none)';
  return violations
    .map(v => `  [${v.impact.toUpperCase()}] ${v.id}: ${v.description} — ${v.nodeCount} node(s)\n    ${v.helpUrl}${v.sampleNodeHtml ? `\n    sample: ${v.sampleNodeHtml}` : ''}`)
    .join('\n');
}

export function violationsByImpact(
  violations: A11yViolation[],
  ...impacts: string[]
): A11yViolation[] {
  return violations.filter(v => impacts.includes(v.impact));
}
