/* eslint-disable */
import * as core from "@actions/core"

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export function run() {
  try {
    const eslintOutputPath = core.getInput("eslint-output-path", {
      required: true,
    })

    core.debug(eslintOutputPath)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
