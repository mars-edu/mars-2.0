export default function buildInfoPlugin() {
  return {
    name: 'build-info',
    transformIndexHtml: {
      enforce: 'post',
      transform(html, ctx) {
        const buildTime = new Date().toISOString()
        const environment = process.env.NODE_ENV || 'development'
        const version = process.env.APP_VERSION || '1.0.0'
        
        const buildInfoScript = `
  <script>
    window.__BUILD_INFO__ = {
      buildTime: '${buildTime}',
      environment: '${environment}',
      version: '${version}',
      timestamp: ${Date.now()}
    };
    console.log('Build Info:', window.__BUILD_INFO__);
  </script>`
        
        return html.replace('</head>', `${buildInfoScript}\n</head>`)
      }
    }
  }
} 