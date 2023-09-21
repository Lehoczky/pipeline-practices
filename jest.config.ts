import type { Config } from "jest"

console.log("process.env.CI:", process.env.CI)

const config: Config = {
  reporters: [["github-actions", { silent: false }], "summary"],
}

export default config
