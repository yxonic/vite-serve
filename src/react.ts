import { send, PluginOption } from 'vite'

import React from '@vitejs/plugin-react'

export async function loadPlugins(
  filepath: string,
): Promise<(PluginOption | PluginOption[])[]> {
  return [
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
<div id="root"></div>
<script type="module">
  import React from 'react'
  import ReactDOM from 'react-dom'

  import App from '/@fs${filepath}'

  ReactDOM.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(App),
    ),
    document.getElementById('root'),
  )
</script>
</body>
</html>`,
            req.originalUrl,
          )
          return send(req, res, html, 'html')
        })
      },
    },
    React(),
  ]
}
