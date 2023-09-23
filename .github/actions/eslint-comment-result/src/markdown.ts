interface CreateImageParams {
  src: string
  align?: "top" | "center" | "middle" | "bottom"
  width?: number
}

export function createImage({
  src,
  align = "bottom",
  width = 20,
}: CreateImageParams) {
  return `<img src="${src}" align="${align}" width="${width}">`
}

export function createCodeBlock(code: string, language: string) {
  return `\`\`\`${language}\n${code}\`\`\``
}

export function createCollapsableBlock(summary: string, details: string) {
  return `
<details>

<summary>${summary}</summary>

  ${details}

</details>`.trim()
}
