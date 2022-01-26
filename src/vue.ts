import { send, PluginOption } from 'vite'

import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'

export const prebundles = ['vue']

export async function loadPlugins(
  filepath: string,
): Promise<(PluginOption | PluginOption[])[]> {
  return [
    {
      name: 'index',
      configureServer: (server) => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/') return next()
          const html = await server.transformIndexHtml(
            req.url,
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
</head>
<body>
<div id="app"></div>
<script type="module">
  import { createApp } from 'vue'
  import 'virtual:windi.css'
  import App from '/@fs${filepath}'
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
    VueJsx(),
  ]
}
