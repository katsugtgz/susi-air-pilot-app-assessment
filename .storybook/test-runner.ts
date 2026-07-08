import type { TestRunnerConfig } from '@storybook/test-runner'

/**
 * Storybook test-runner config.
 *
 * Default behavior already fails on:
 *   - uncaught exceptions in the iframe
 *   - console.error calls
 *   - failed network requests for story assets
 *
 * This file exists primarily so the framework picks up its conventions
 * (e.g., story-level `play` functions if we add them later). No custom
 * hooks needed yet — the defaults are sufficient for smoke-testing that
 * every story renders without throwing.
 */
const config: TestRunnerConfig = {}

export default config
