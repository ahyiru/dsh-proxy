import {startServer} from 'huxy-node-server';
import {codeAuth} from 'huxy-node-server/codeAuth';

export const name = 'huxy-dsh-proxy';

export const inject = ['webServer'];

const randomUUID_Script = `<script>(function() {
  if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    crypto.randomUUID = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }
})();</script>`;

export function apply(ctx, {port, ...authConfig} = {}) {
  ctx.effect(() => {
    ctx.webServer.tapIndex(html => html.replace('</head>', `${randomUUID_Script}</head>`));
    const {httpServer} = startServer({
      port,
      proxys: [{
        target: 'http://localhost:3080',
      }],
      logger: console,
      serverLogger: (_, logger) => logger.info(`代理服务运行在 ${_.port} 端口`),
    }, null, (_, app) => {
      codeAuth(authConfig, app);
    });

    return () => {
      httpServer.close();
      console.log('[huxy-dsh-proxy] 代理已关闭');
    };
  });
};
