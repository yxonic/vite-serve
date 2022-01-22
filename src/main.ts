#!/usr/bin/env node
import { createServer, send } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const vueScript = `<html>
  <body>
    <div id="app"></div>
    <script module>
    const app = import('./main.vue')
    app.then(({ default: App }) => {
      const vue = import('/node_modules/vue')
      vue.then(({ createApp }) => {
        const app = createApp(App)
        app.mount('#app')
      })
    })
    </script>
  </body>
</html>`

async function main() {
  const server = await createServer({
    resolve: {
      alias: {
        '/node_modules': path.resolve(__dirname, '../node_modules/'),
        vue: path.resolve(__dirname, '../node_modules/vue'),
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
      vue(),
    ],
  })
  await server.listen()
  server.printUrls()
}

main()
