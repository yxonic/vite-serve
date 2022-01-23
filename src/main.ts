#!/usr/bin/env node
import { createServer } from 'vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { cac } from 'cac'
import colors from 'picocolors'
import WindiCSS from 'vite-plugin-windicss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json')).toString(),
).version

const modulePath = fs.existsSync(path.resolve(__dirname, '../node_modules/'))
  ? path.resolve(__dirname, '../node_modules/')
  : path.resolve(__dirname, '../../')

interface ServeOptions {
  host?: string
  port?: number
  type?: string
  preflight: boolean
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
    const module = await import(`./${type}.js`)
    const server = await createServer({
      root: modulePath,
      optimizeDeps: {
        include: module.prebundles,
      },
      server: {
        host: options.host,
        port: options.port,
        watch: {
          ignored: ['/'],
        },
      },
      plugins: [
        await module.loadPlugins(filepath),
        WindiCSS({
          config: {
            preflight: options.preflight,
            extract: {
              include: [`${path.dirname(filepath)}/*.{html,js,jsx,ts,tsx,vue}`],
            },
          },
        }),
      ],
    })
    server.watcher.add(`${path.dirname(filepath)}/**`)

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
  .option('--no-preflight', 'disable preflight style from windicss')
  .action(serve)

cli.help()
cli.version(version)

cli.parse()
