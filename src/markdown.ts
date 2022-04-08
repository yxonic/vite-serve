import { send, PluginOption } from 'vite'
import path from 'path'
import Vue from '@vitejs/plugin-vue'
import VMark from '@yxonic/vmark/vite'
import * as shiki from 'shiki'

export const prebundles = ['vue']

export async function loadPlugins(
  filepath: string,
): Promise<(PluginOption | PluginOption[])[]> {
  const highlighter = await shiki.getHighlighter({
    theme: 'dracula-soft',
  })
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
<div class="mx-auto px-8 py-20 prose">
  <div id="app"></div>
</div>
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
          return send(req, res, html, 'html', {})
        })
      },
    },
    Vue(),
    VMark({
      customRules: {
        fence(token) {
          return {
            tag: 'div',
            attrs: {
              innerHTML: highlighter.codeToHtml(token.content, {
                lang: token.info,
              }),
            },
            children: [],
          }
        },
      },
      defaultComponentDir: path.dirname(filepath),
    }),
  ]
}
