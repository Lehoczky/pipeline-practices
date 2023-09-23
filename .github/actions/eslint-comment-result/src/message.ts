import type { ESLint } from "eslint"

import stylishFormatter from "./vendored"

export function createMessage(results: ESLint.LintResult[]) {
  const problematicFiles = results.filter(
    ({ errorCount, warningCount }) => errorCount > 0 || warningCount > 0,
  )
  const accumulatedResults = accumulateErrorsAndWarnings(problematicFiles)
  if (accumulatedResults.hasNoErrorsOrWarnings) {
    throw new Error(
      "There are no errors or warnings, this action shouldn't be called.",
    )
  }

  const title = createTitle(accumulatedResults)
  const codeBlockWithEslintOutput =
    createCodeBlockWithESLintOutput(problematicFiles)
  const footer = createFooter(accumulatedResults)

  return `${title}\n\n${codeBlockWithEslintOutput}\n\n${footer}`
}

interface AccumulatedResults {
  hasErrorsAndWarnings: boolean
  hasOnlyErrors: boolean
  hasOnlyWarnings: boolean
  hasNoErrorsOrWarnings: boolean
  isEveryErrorFixable: boolean
  isEveryWarningFixable: boolean
}

function accumulateErrorsAndWarnings(
  results: ESLint.LintResult[],
): AccumulatedResults {
  let errorCountAll = 0
  let fixableErrorCountAll = 0
  let warningCountAll = 0
  let fixableWarningCountAll = 0

  for (const result of results) {
    errorCountAll += result.errorCount
    fixableErrorCountAll += result.fatalErrorCount
    warningCountAll += result.warningCount
    fixableWarningCountAll += result.fixableWarningCount
  }

  return {
    hasErrorsAndWarnings: errorCountAll > 0 && warningCountAll > 0,
    hasOnlyErrors: errorCountAll > 0 && warningCountAll === 0,
    hasOnlyWarnings: errorCountAll === 0 && warningCountAll > 0,
    hasNoErrorsOrWarnings: errorCountAll === 0 && warningCountAll === 0,
    isEveryErrorFixable: errorCountAll === fixableErrorCountAll,
    isEveryWarningFixable: warningCountAll === fixableWarningCountAll,
  }
}

function createTitle({
  hasErrorsAndWarnings,
  hasOnlyErrors,
}: AccumulatedResults) {
  const eslintIcon = `<img src="https://api.iconify.design/logos:eslint.svg" align="top" width="24">`

  if (hasErrorsAndWarnings) {
    return `### ${eslintIcon} Lint errors and warnings have been found in the codebase ❗`
  }
  if (hasOnlyErrors) {
    return `### ${eslintIcon} Lint errors have been found in the codebase ❗`
  }
  return `### ${eslintIcon} Lint warnings have been found in the codebase ⚠`
}

function createCodeBlockWithESLintOutput(results: ESLint.LintResult[]) {
  const stylishOutput = stylishFormatter(results)
  return `\`\`\`sh\n${stylishOutput}\`\`\``
}

function createFooter({
  hasErrorsAndWarnings,
  hasOnlyErrors,
  hasOnlyWarnings,
  isEveryErrorFixable,
  isEveryWarningFixable,
}: AccumulatedResults) {
  if (hasErrorsAndWarnings && isEveryErrorFixable && isEveryWarningFixable) {
    return createAutoFixSuggestions(
      "All of these errors and warnings are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (hasOnlyErrors && isEveryErrorFixable) {
    return createAutoFixSuggestions(
      "All of these errors are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (hasOnlyWarnings && isEveryWarningFixable) {
    return createAutoFixSuggestions(
      "All of these warnings are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (hasErrorsAndWarnings) {
    return "Please fix these errors and warnings locally, and commit the changes to the PR^^"
  }
  if (hasOnlyErrors) {
    return "Please fix these errors locally, and commit the changes to the PR^^"
  }
  if (hasOnlyWarnings) {
    return "Please fix these warnings locally, and commit the changes to the PR^^"
  }
  throw new Error(
    "None of the scenarios has been encountered in the `createFooter() function, but they should exhaust every possible option.`",
  )
}

function createAutoFixSuggestions(listTitle: string) {
  const suggestions = [
    "run `npm run eslint:fix` locally and commit the changes",
    "if you are using [VSCode](https://code.visualstudio.com/), open the files with the errors, open the [command palette](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_command-palette) and run the `ESLint: Fix all auto-fixable Problems` command",
    "type `/ci-autofix-lint` as comment to this PR and a workflow will automatically fix these errors for you and commit the changes to the PR",
  ]
  const suggestionsAsListElements = suggestions
    .map((suggestion) => `- ${suggestion}`)
    .join("\n")

  return `${listTitle}\n${suggestionsAsListElements}`
}
