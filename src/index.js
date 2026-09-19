import {startServer} from 'huxy-node-server';
import {codeAuth} from 'huxy-node-server/codeAuth';

export const name = 'huxy-dsh-proxy';

export const inject = ['webServer'];

const BOOTSTRAP_SCRIPT = `<script>
(function() {
  if (!globalThis.__DSH_TRANSPORT__) {
    globalThis.__DSH_TRANSPORT__ = {
      ownsHost: true,
      fetch,
    };
  }
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

export function apply(ctx, {port, authHosts, authConfig} = {}) {
  ctx.effect(async () => {
    ctx.webServer.tapIndex(html => html.replace('</head>', `${BOOTSTRAP_SCRIPT}</head>`));
    const {httpServer} = await startServer({
      port,
      proxys: [{
        target: `http://localhost:${ctx.webServer.config?.port ?? 3080}`,
      }],
      logger: console,
      serverLogger: (_, logger) => logger.info(`代理服务运行在 ${_.port} 端口`),
    }, null, (_, app) => {
      app.use((req, res, next) => {
        if (authHosts && !authHosts.includes(req.hostname)) {
          req.trustedAuthHost = true;
        }
        next();
      });
      try {
        codeAuth(authConfig, app);
      } catch (err) {
        console.error(`❌ 鉴权服务启动失败，如需启用请完善 [authConfig] 配置！Error: ${err.message}`);
      }
    });

    return () => {
      httpServer.close();
      console.log('[huxy-dsh-proxy] 代理已关闭');
    };
  });
};
