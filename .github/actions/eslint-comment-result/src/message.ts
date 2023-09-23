import type { ESLint } from "eslint"

import {
  createCodeBlock,
  createCollapsableBlock,
  createImage,
} from "./markdown"
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
  const FAQSection = createFrequentlyAskedQuestions()

  return `${title}\n\n${codeBlockWithEslintOutput}\n\n${footer}\n\n---\n\n${FAQSection}`
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
  const eslintIcon = createImage({
    src: "https://api.iconify.design/logos:eslint.svg",
    align: "top",
  })

  if (hasErrorsAndWarnings) {
    return `${eslintIcon} **Lint errors and warning have been found in the codebase ❗**`
  }
  if (hasOnlyErrors) {
    return `${eslintIcon} **Lint errors have been found in the codebase ❗**`
  }
  return `${eslintIcon} **Lint warnings have been found in the codebase ⚠**`
}

function createCodeBlockWithESLintOutput(results: ESLint.LintResult[]) {
  const stylishOutput = stylishFormatter(results)
  return createCodeBlock(stylishOutput, "sh")
}

function createFooter(accumulatedResults: AccumulatedResults) {
  if (
    accumulatedResults.hasErrorsAndWarnings &&
    accumulatedResults.isEveryErrorFixable &&
    accumulatedResults.isEveryWarningFixable
  ) {
    return createAutoFixSuggestions(
      "All of these errors and warnings are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (
    accumulatedResults.hasOnlyErrors &&
    accumulatedResults.isEveryErrorFixable
  ) {
    return createAutoFixSuggestions(
      "All of these errors are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (
    accumulatedResults.hasOnlyWarnings &&
    accumulatedResults.isEveryWarningFixable
  ) {
    return createAutoFixSuggestions(
      "All of these warnings are auto-fixable, you can do one of the following things to resolve them, choose based on which one is more convenient for you:",
    )
  }
  if (accumulatedResults.hasErrorsAndWarnings) {
    return "Please fix these errors and warnings locally, and commit the changes to the PR^^"
  }
  if (accumulatedResults.hasOnlyErrors) {
    return "Please fix these errors locally, and commit the changes to the PR^^"
  }
  if (accumulatedResults.hasOnlyWarnings) {
    return "Please warning these errors locally, and commit the changes to the PR^^"
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

function createFrequentlyAskedQuestions() {
  const title = "_Frequently Asked Questions ❔_"

  const FAQs = [
    createCollapsableBlock(
      "Why do I see this message?",
      "We use [ESLint](https://eslint.org/) as our JavaScript [linter](https://en.wikipedia.org/wiki/Lint_%28software%29), and run it as part of CI workflow for each PR. It found some errors in this PR's branch.",
    ),
    createCollapsableBlock(
      "One of the files with lint errors is autogenerated. What should I do?",
      `You have a few options:
- if you want to ignore the errors and you can access the code generator's source or configuration, you can add an \`/* eslint-disable */\` comment to the top of the file. This is what [unplugin/unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import/blob/main/test/__snapshots__/dts.test.ts.snap) or [graphql codegen](https://the-guild.dev/graphql/codegen/plugins/other/add) does
- if you want to ignore the errors, but cant change the file output, you should find the \`.eslintignore\` file at the root of the repository and write a globe pattern to ignore this (and potentially other, new) generated file
- if you want to fix the errors and can access the code generator's source, you could use the [ESLint API](https://eslint.org/docs/latest/integrate/nodejs-api) as part of the generation process to fix the issues.`,
    ),
    createCollapsableBlock(
      "The reported error is in a file I haven't touched. What should I do?",
      "Someone might have bypassed the branch protection rules, and committed a file with lint errors to master. The best you can do is to create a new PR with only the lint fixes, and notify everyone else in the [slack channel]() about it. After that PR gets merged, you can merge master into this PR, and the lint errors will be solved.",
    ),
    createCollapsableBlock(
      "I didn't see these errors in my IDE, is there a way to see them there?",
      `Of course! If you are using [VSCode](https://code.visualstudio.com/), download the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and then reload your IDE. You might also want to read [the documentation about how to install every recommended extension]().
If you still can't see the lint errors in the IDE, contact **Zoltan Lehoczky**, and he will help:)

You can also add the following configuration to your [user's setting.json](https://code.visualstudio.com/docs/getstarted/settings) file, to auto-fix errors on save:

\`\`\`json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
  }
}
\`\`\``,
    ),
    createCollapsableBlock(
      "I think one of the rules should be turned off, because it doesn't make sense to use it. Who should I contact?",
      "You can suggest turning a rule off in the [#frontend]() channel. Make sure to describe your arguments against the rules, and link other sources with the information if you can:)",
    ),
    createCollapsableBlock(
      "I think this message can be improved. Who should I tell my ideas?",
      "You can post your improvement idea in the [#frontend]() channel, we will make sure to respond, and take your suggestions seriously;)",
    ),
  ]

  const FAQsJoined = FAQs.join("\n")
  return `${title}\n\n${FAQsJoined}`
}
