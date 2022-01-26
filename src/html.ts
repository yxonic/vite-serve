import { send, PluginOption } from 'vite'
import fs from 'fs'

export async function loadPlugins(
  filepath: string,
): Promise<(PluginOption | PluginOption[])[]> {
  return [
    {
      name: 'index',
      configureServer: (server) => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/') return next()
          let fileContent = fs.readFileSync(filepath).toString()
          fileContent = fileContent.replace(
            '</body>',
            `<script type="module">import 'virtual:windi.css'</script> </body>`,
          )
          const html = await server.transformIndexHtml(
            req.url,
            fileContent,
            req.originalUrl,
          )
          return send(req, res, html, 'html')
        })
      },
    },
  ]
}
