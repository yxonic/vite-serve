#!/usr/bin/env node
import { createServer } from 'vite'
import path from 'path'
import fs from 'fs'
import { cac } from 'cac'
import colors from 'picocolors'
import WindiCSS from 'vite-plugin-windicss'
import typography from 'windicss/plugin/typography'

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
  if (ext === '.html') {
    return 'html'
  }
  if (ext === '.vue') {
    return 'vue'
  }
  if (ext === '.md') {
    return 'markdown'
  }
  if (/^\.[jt]sx?$/.test(ext)) {
    return 'react'
  }
  throw new Error('unknown file extension')
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
            preflight: options.preflight
              ? {
                  includeAll: true,
                }
              : false,
            extract: {
              include: [
                `${path.dirname(filepath)}/*.{html,js,jsx,ts,tsx,vue,md}`,
              ],
            },
            safelist: ['mx-auto px-8 py-20 prose'],
            plugins: [typography()],
          },
        }),
      ],
    })
    server.watcher.add(`${path.dirname(filepath)}/**`)

    await server.listen()

    console.log(
      colors.cyan(`\n  vite-serve v${version}`) +
        ` serving ` +
        colors.green(filename) +
        ` at:\n`,
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
    `[string] component type (choose from html, vue, react, markdown)`,
  )
  .option('--no-preflight', 'disable preflight style from windicss')
  .action(serve)

cli.help()
cli.version(version)

cli.parse()
