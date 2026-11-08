import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'
import { format } from 'prettier'

const root = fileURLToPath(new URL('../', import.meta.url))
for (const name of ['todos', 'system']) {
const schemaPath = resolve(root, `.cache/openapi/${name}.json`)
const outputPath = resolve(root, `packages/api/src/generated/${name}.ts`)
const check = process.argv.includes('--check')
const result = spawnSync(
  process.env.PYTHON || 'python',
  [resolve(root, 'tools/export_todos_openapi.py'), schemaPath, ...(name === 'system' ? ['--all'] : [])],
  { cwd: resolve(root, 'apps/cloud/backend'), stdio: 'inherit' },
)
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
const ast = await openapiTS(schema, { defaultNonNullable: false })
const source = astToString(ast, { formatOptions: { removeComments: true } })
const generated = await format(
  `// 此文件由 npm run generate:api 自动生成，请勿手动修改。\n${source}`,
  { parser: 'typescript', semi: false, singleQuote: true, trailingComma: 'all', printWidth: 100 },
)

if (check) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')
  if (current !== generated) {
    console.error(`[接口类型生成] ${name} 接口类型已过期，请运行 npm run generate:api`)
    process.exitCode = 1
  } else {
    console.info(`[接口类型生成] ${name} 接口类型与后端契约一致`)
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, generated, 'utf8')
  console.info(`[接口类型生成] 已更新 packages/api/src/generated/${name}.ts`)
}

}
