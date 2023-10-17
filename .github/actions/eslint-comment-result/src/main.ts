/* eslint-disable */
import * as core from "@actions/core"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { ESLint } from "eslint"
import stylishFormatter from "./vendored"

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run() {
  try {
    const eslintOutputPath = core.getInput("eslint-output-path", {
      required: true,
    })
    if (!existsSync(eslintOutputPath)) {
      core.info(
        `ESLint output not found at ${eslintOutputPath}. Skipping action 🚧`,
      )
      return
    }

    const eslintOutputText = await readFile(eslintOutputPath, "utf-8")
    const eslintResults: ESLint.LintResult[] = JSON.parse(eslintOutputText)
    core.info(`Found ESLint output:\ ${JSON.stringify(eslintResults, null, 2)}`)

    const eslintOutput = stylishFormatter(eslintResults)
    const {
      hasErrors,
      hasWarnings,
      isEveryErrorFixable,
      isEveryWarningFixable,
    } = accumulateErrorsAndWarnings(eslintResults)

    core.setOutput("eslint-output", eslintOutput)
    core.setOutput("has-errors", hasErrors)
    core.setOutput("has-warnings", hasWarnings)
    core.setOutput("is-every-error-fixable", isEveryErrorFixable)
    core.setOutput("is-every-warning-fixable", isEveryWarningFixable)
  } catch (error) {
    if (error instanceof Error || typeof error === "string") {
      core.setFailed(error)
    }
  }
}

function accumulateErrorsAndWarnings(results: ESLint.LintResult[]) {
  const problematicFiles = results.filter(
    ({ errorCount, warningCount }) => errorCount > 0 || warningCount > 0,
  )

  let errorCountAll = 0
  let fixableErrorCountAll = 0
  let warningCountAll = 0
  let fixableWarningCountAll = 0

  for (const result of problematicFiles) {
    errorCountAll += result.errorCount
    fixableErrorCountAll += result.fatalErrorCount
    warningCountAll += result.warningCount
    fixableWarningCountAll += result.fixableWarningCount
  }

  return {
    hasErrors: errorCountAll > 0,
    hasWarnings: warningCountAll > 0,
    isEveryErrorFixable: errorCountAll === fixableErrorCountAll,
    isEveryWarningFixable: warningCountAll === fixableWarningCountAll,
  }
}
