# @huxy/dsh-proxy

- 局域网浏览器 `HTTP` 暴露 `crypto.randomUUID`。
- 基于 [huxy-node-server](https://www.npmjs.com/package/huxy-node-server) 代理服务的 `dsh` 插件。提供代理服务供局域网或 `Cloudflared Tunnel`、`Tailscale` 等访问，添加邮箱发验证码鉴权 [huxy-node-server/codeAuth](https://github.com/ahyiru/huxy-node-server/blob/main/docs/AUTH.md) ，保障外网安全性。适用于内部系统、管理后台或团队协作场景的轻量级身份验证。

## 实现

```
export function apply(ctx, {port, isDev, ...authConfig} = {}) {
  ctx.effect(() => {
    const {httpServer} = startServer({
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
```

## 安装

```
dsh plugin --profile web add @huxy/dsh-proxy

dsh plugin --profile web add github:ahyiru/dsh-proxy

```

源码安装

```
pnpm dsh plugin --profile web add @huxy/dsh-proxy

pnpm dsh plugin --profile web add github:ahyiru/dsh-proxy

```

### 卸载

```
dsh plugin --profile web remove @huxy/dsh-proxy
```

## 配置

编辑 `~/.dsh/profiles/web/cordis.patch.yml`

```javascript

- id: huxy-dsh-proxy
  name: '@huxy/dsh-proxy'
  config:
    port: 8030
    session:
      secret: 'your-secret'
      maxAge: 30
    code:
      ttl: 300000
      len: 6
      maxAttempts: 5
    mail:
      host: 'smtp.gmail.com'
      port: 465
      secure: true
      auth:
        type: 'OAuth2'
        user: 'xxx@gmail.com'
        clientId: 'xxx'
        clientSecret: 'xxx'
        refreshToken: 'xxx'
      from: 'XX <xxx@gmail.com>'
      subject: 'XX 访问验证码'
    allowedEmails:
      - 'xxx@gmail.com'
      - 'xxx@qq.com'
    page:
      title: 'XX 团队'
      tips: '请使用 XX 团队电子邮件验证！'
      footer: '仅供 XX 团队使用。'

```

详细配置可参见：

- [huxy-node-server](https://www.npmjs.com/package/huxy-node-server) 
- [huxy-node-server/codeAuth](https://github.com/ahyiru/huxy-node-server/blob/main/docs/AUTH.md) 

开发环境可设置 `isDev: true` 禁用鉴权页面。