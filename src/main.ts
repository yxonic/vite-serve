#!/usr/bin/env node
import { createServer, send } from 'vite'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { cac } from 'cac'
import colors from 'picocolors'

import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'

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
}

async function serve(filepath: string, options: ServeOptions) {
  try {
    const server = await createServer({
      configFile: false,
      resolve: {
        alias: {
          vue: path.resolve(modulePath, './vue'),
        },
      },
      server: {
        host: options.host,
        port: options.port,
        fs: {
          allow: [modulePath, process.cwd()],
        },
      },
      plugins: [
        {
          name: 'index',
          configureServer: (server) => {
            server.middlewares.use(async (req, res, next) => {
              if (
                !req.url ||
                (!req.url.endsWith('/') && !req.url.endsWith('.html'))
              )
                return next()
              const html = await server.transformIndexHtml(
                req.url,
                `<html>
  <body>
    <div id="app"></div>
    <script type="module">
      import 'virtual:windi.css'
      import App from '/${filepath}'
      import { createApp } from 'vue'
      const app = createApp(App)
      app.mount('#app')
    </script>
  </body>
</html>`,
                req.originalUrl,
              )
              return send(req, res, html, 'html')
            })
          },
        },
        Vue(),
        WindiCSS({
          config: {
            extract: {
              include: [`${process.cwd()}/${filepath}`],
            },
          },
        }),
      ],
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
  .action(serve)

cli.help()
cli.version(version)

cli.parse()
