<div align="center">
<img src="https://raw.githubusercontent.com/cooderl/wewe-rss/main/assets/logo.png" width="80" alt="预览"/>

<h1 align="center">WeWe RSS</h1>

免费、开源的微信公众号订阅方式。


![主界面](https://raw.githubusercontent.com/cooderl/wewe-rss/main/assets/preview1.png)

</div>

## 功能

- [x]  支持订阅微信公众号（基于微信读书）
- [x]  后台定时更新文章
- [x]  微信公众号RSS生成（支持`.atom`\.`rss`\.`json`格式)
- [x]  全文输出


## 部署

### Docker Compose 部署

[docker-compose.yml](https://github.com/cooderl/wewe-rss/blob/main/docker-compose.yml)

```yaml
version: '3.9'

services:
  db:
    image: mysql:latest
    command: --default-authentication-plugin=mysql_native_password
    environment:
      # 请修改为自己的密码
      MYSQL_ROOT_PASSWORD: 123456
      TZ: 'Asia/Shanghai'
      MYSQL_DATABASE: 'wewe-rss'
    # ports:
    #   - 13306:3306
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      timeout: 45s
      interval: 10s
      retries: 10

  server:
    image: cooderl/wewe-rss-server:latest
    ports:
      - 4000:4000
    depends_on:
      db:
        condition: service_healthy
    environment:
      # 数据库连接地址
      - DATABASE_URL=mysql://root:123456@db:3306/wewe-rss?schema=public&connect_timeout=30&pool_timeout=30&socket_timeout=30
      # 服务接口请求授权码
      - AUTH_CODE=123567
      # 提取全文内容模式
      # - FEED_MODE=fulltext
      # 服务接口请求限制，每分钟请求次数
      - MAX_REQUEST_PER_MINUTE=60
      # 外网访问时，需设置为服务器的公网 IP 或者域名地址
      - SERVER_ORIGIN_URL=http://localhost:4000

  web:
    image: cooderl/wewe-rss-web:latest
    ports:
      - 3000:3000
    environment:
      # 同 SERVER_ORIGIN_URL
      - NEXT_PUBLIC_SERVER_ORIGIN_URL=http://localhost:4000
      # 路由前缀，在配置nginx路径时可以使用
      - BASE_PATH=''

networks:
  wewe-rss:

volumes:
  db_data:

```

### Docker 命令启动

1. 启动 MySQL 数据库

```sh
docker run -d \
  --name db \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e TZ='Asia/Shanghai' \
  -e MYSQL_DATABASE='wewe-rss' \
  -v db_data:/var/lib/mysql \
  mysql:latest --default-authentication-plugin=mysql_native_password

```

2. 启动 Server

```sh
docker run -d \
  --name server \
  -p 4000:4000 \
  -e DATABASE_URL='mysql://root:123456@db:3306/wewe-rss?schema=public&connect_timeout=30&pool_timeout=30&socket_timeout=30' \
  -e AUTH_CODE=123567 \
  -e FEED_MODE=fulltext \ 
  -e MAX_REQUEST_PER_MINUTE=60 \
  -e SERVER_ORIGIN_URL="http://localhost:4000" \
  cooderl/wewe-rss-server:latest

```

3. 启动 Web

```sh
docker run -d \
  --name web \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SERVER_ORIGIN_URL="http://localhost:4000" \
  cooderl/wewe-rss-web:latest

```

### 本地部署

如果你想本地部署，请使用 `pnpm install &&  pnpm run -r build && pnpm run -r start` 命令(可以配合 pm2 来守护进程，防止被杀死)。


## 使用方式

1. 进入账号管理，点击添加账号，微信扫码登录微信读书账号。
<img width="400" src="./assets/preview2.png"/>

1. 进入公众号源，点击添加，通过提交微信公众号分享链接，订阅微信公众号。
<img width="400" src="./assets/preview3.png"/>


## 环境变量

### Server服务端

- `DATABASE_URL` （必填项）Mysql 数据库地址，例如 `mysql://root:123456@127.0.0.1:3306/wewe-rss`。

- `AUTH_CODE` （必填项）服务端接口请求授权码，(`/feeds`路径不需要)。


- `SERVER_ORIGIN_URL` （必填项）服务端访问地址，用于RSS生成时使用。

- `MAX_REQUEST_PER_MINUTE`每分钟最大请求次数，默认 60。

- `FEED_MODE` 输出模式，可选值 `fulltext`，RSS接口会变慢，占用更多内存。

### Web前端

- `NEXT_PUBLIC_SERVER_ORIGIN_URL` （必填项）服务端接口地址，一般跟 `SERVER_ORIGIN_URL` 一致即可。


- `BASE_PATH` 路由前缀，在配置nginx路径时可以使用


## 本地开发


1. 安装 nodejs 18 和 pnpm；
2. 修改环境变量`cp ./apps/web/.env.local.example ./apps/web/.env`和`cp ./apps/server/.env.local.example ./apps/server/.env`
3. 执行 `pnpm install && pnpm dev` 即可。⚠️ 注意：此命令仅用于本地开发，不要用于部署！
