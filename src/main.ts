#!/usr/bin/env node
import { createServer, send } from 'vite'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'

import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const vueScript = `<html>
  <body>
    <div id="app"></div>
    <script type="module">
      import 'virtual:windi.css'
      import App from '/main.vue'
      import { createApp } from 'vue'
      const app = createApp(App)
      app.mount('#app')
    </script>
  </body>
</html>`

const modulePath = existsSync(path.resolve(__dirname, '../node_modules/'))
  ? path.resolve(__dirname, '../node_modules/')
  : path.resolve(__dirname, '../../')

async function main() {
  const server = await createServer({
    configFile: false,
    resolve: {
      alias: {
        vue: path.resolve(modulePath, './vue'),
      },
    },
    server: {
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
              vueScript,
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
            include: [`${process.cwd()}/main.vue`],
          },
        },
      }),
    ],
  })

  await server.listen()
  console.log(
    `vite-serve v${
      JSON.parse(
        readFileSync(path.resolve(__dirname, '../package.json')).toString(),
      ).version
    } running at:\n`,
  )
  server.printUrls()
}

main()
