import type { Config } from "jest"

const config: Config = {
  reporters: [["github-actions", { silent: false }], "summary"],
}

export default config
