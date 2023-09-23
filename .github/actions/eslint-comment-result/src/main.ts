/* eslint-disable */
import * as core from "@actions/core"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { ESLint } from "eslint"
import { createMessage } from "./message"

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

    const message = await createMessage(eslintResults)

    core.setOutput("message", message)
  } catch (error) {
    if (error instanceof Error || typeof error === "string") {
      core.setFailed(error)
    }
  }
}
