#!/usr/bin/env node
import { createServer } from 'vite'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { cac } from 'cac'
import colors from 'picocolors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const version = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json')).toString(),
).version

const modulePath = existsSync(path.resolve(__dirname, '../node_modules/'))
  ? path.resolve(__dirname, '../node_modules/')
  : path.resolve(__dirname, '../../')

interface ServeOptions {
  host?: string
  port?: number
  type?: string
}

function getTypeByExt(filepath: string) {
  const ext = path.extname(filepath)
  if (ext === '.vue') {
    return 'vue'
  } else if (/^\.[jt]sx?$/.test(ext)) {
    return 'react'
  }
  throw new Error('unknown file ext')
}

async function serve(filename: string, options: ServeOptions) {
  try {
    const filepath = path.resolve(filename)
    const type = options.type || getTypeByExt(filepath)
    const server = await createServer({
      configFile: false,
      root: modulePath,
      optimizeDeps: {
        include: type === 'vue' ? ['vue'] : ['react', 'react-dom'],
      },
      server: {
        host: options.host,
        port: options.port,
        fs: {
          allow: [modulePath, process.cwd()],
        },
      },
      plugins: await (await import(`./${type}.js`)).loadPlugins(filepath),
    })

    await server.listen()

    console.log(
      colors.cyan(`\n  vite-serve v${version}`) +
        colors.green(` dev server running at:\n`),
    )

    server.printUrls()
  } catch (e) {
    console.error(
      colors.red(`error when starting preview server:\n${(e as Error).stack}`),
      { error: e },
    )
    process.exit(1)
  }
}

const cli = cac('vite-serve')

cli
  .command('<path>', `serve a single file component`)
  .option('--host [host]', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option(
    '-t, --type <type>',
    `[string] component type (choose from vue, react)`,
  )
  .action(serve)

cli.help()
cli.version(version)

cli.parse()
