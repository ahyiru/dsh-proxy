import {startServer} from 'huxy-node-server';
import {codeAuth} from 'huxy-node-server/codeAuth';

export const name = 'huxy-dsh-proxy';

export const inject = ['webServer'];

const randomUUID_Script = `<script>
(function() {
  if (typeof crypto === 'undefined' || crypto.randomUUID) return;
  Object.defineProperty(crypto, 'randomUUID', {
    value: function() {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      return Array.from(buf, (byte, i) => {
        const hex = byte.toString(16).padStart(2, '0');
        if ([4, 6, 8, 10].includes(i)) return '-' + hex;
        return hex;
      }).join('');
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
})();
</script>`;

export function apply(ctx, {port, isDev, ...authConfig} = {}) {
  ctx.effect(async () => {
    ctx.webServer.tapIndex(html => html.replace('</head>', `${randomUUID_Script}</head>`));
    const {httpServer} = await startServer({
      port,
      proxys: [{
        target: 'http://localhost:3080',
      }],
      logger: console,
      serverLogger: (_, logger) => logger.info(`代理服务运行在 ${_.port} 端口`),
    }, null, (_, app) => {
      isDev || codeAuth(authConfig, app);
    });

    return () => {
      httpServer.close();
      console.log('[huxy-dsh-proxy] 代理已关闭');
    };
  });
};
