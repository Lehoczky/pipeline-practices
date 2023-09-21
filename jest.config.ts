import type { Config } from "jest"

const config: Config = {
  reporters: process.env.CI
    ? ["default", ["github-actions", { silent: false }]]
    : ["default"],
}

export default config
