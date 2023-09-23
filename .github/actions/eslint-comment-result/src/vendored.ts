/**
 * @fileoverview Stylish reporter
 *
 * @author Sindre Sorhus
 */
"use strict"

import table from "text-table"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Given a word and a count, append an s if count is not one.
 *
 * @param word A word in its singular form.
 *
 * @param count A number controlling whether word should be pluralized.
 *
 * @returns The original word with an s on the end if count is not one.
 */
function pluralize(word: any, count: any) {
  return count === 1 ? word : `${word}s`
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export default function (results: any) {
  let output = "\n",
    errorCount = 0,
    warningCount = 0,
    fixableErrorCount = 0,
    fixableWarningCount = 0

  results.forEach((result: any) => {
    const messages = result.messages

    if (messages.length === 0) {
      return
    }

    errorCount += result.errorCount
    warningCount += result.warningCount
    fixableErrorCount += result.fixableErrorCount
    fixableWarningCount += result.fixableWarningCount

    output += `${result.filePath}\n`

    output += `${table(
      messages.map((message: any) => {
        const messageType =
          message.fatal || message.severity === 2 ? "error" : "warning"

        return [
          "",
          message.line || 0,
          message.column || 0,
          messageType,
          message.message.replace(/([^ ])\.$/u, "$1"),
          message.ruleId || "",
        ]
      }),
      {
        align: ["l", "r", "l"],
        stringLength(str: any) {
          return str.length
        },
      },
    )
      .split("\n")
      .map((el: any) =>
        el.replace(
          /(\d+)\s+(\d+)/u,
          (_: any, p1: any, p2: any) => `${p1}:${p2}`,
        ),
      )
      .join("\n")}\n\n`
  })

  const total = errorCount + warningCount

  if (total > 0) {
    output += [
      "\u2716 ",
      total,
      pluralize(" problem", total),
      " (",
      errorCount,
      pluralize(" error", errorCount),
      ", ",
      warningCount,
      pluralize(" warning", warningCount),
      ")\n",
    ].join("")

    if (fixableErrorCount > 0 || fixableWarningCount > 0) {
      output += [
        "  ",
        fixableErrorCount,
        pluralize(" error", fixableErrorCount),
        " and ",
        fixableWarningCount,
        pluralize(" warning", fixableWarningCount),
        " potentially fixable with the `--fix` option.\n",
      ].join("")
    }
  }

  return total > 0 ? output : ""
}
