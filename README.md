<div align="center">
<img src="https://raw.githubusercontent.com/cooderl/wewe-rss/main/assets/logo.png" width="80" alt="预览"/>

<h1 align="center"><a href="https://github.com/cooderl/wewe-rss">WeWe RSS</a></h1>

更优雅的微信公众号订阅方式。

![主界面](https://raw.githubusercontent.com/cooderl/wewe-rss/main/assets/preview1.png)

</div>

## 功能

- [x] v2.x版本使用全新接口，更加稳定
- [x] 支持微信公众号订阅（基于微信读书）
- [x] 获取公众号历史发布文章
- [x] 后台自动定时更新内容
- [x] 微信公众号RSS生成（支持`.atom`\.`rss`\.`json`格式)
- [x] 支持全文内容输出，让阅读无障碍
- [x] 所有订阅源导出OPML
- [x] 支持通过/feeds/all.(json|rss|atom)接口和/feeds/:feed对标题进行过滤：使用title_include和title_exclude参数，支持使用`|`实现多个关键词的 或 逻辑
  > {{ORIGIN_URL}}/feeds/all.atom?title_include=张三
  >
  > {{ORIGIN_URL}}/feeds/MP_WXS_123.json?limit=30&title_include=张三|李四|王五&title_exclude=张三丰|赵六
- [x] 支持通过/feeds/:feed接口触发单个feedid更新：使用update=true参数（实时返回结果不包含更新后的articles，要获取更新后的articles需去掉update参数再请求一次）
  > {{ORIGIN_URL}}/feeds/MP_WXS_123.rss?update=true

## 部署

### 一键部署（待完善添加模板）

你可以通过以下平台一键部署，只需填写本项目的URL即可。

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/DI9BBD)

[Railway](https://railway.app/)

[Hugging Face部署参考](https://github.com/cooderl/wewe-rss/issues/32)

### Docker Compose 部署

可参考 [docker-compose.yml](https://github.com/cooderl/wewe-rss/blob/main/docker-compose.yml) 和 [docker-compose.sqlite.yml](https://github.com/cooderl/wewe-rss/blob/main/docker-compose.sqlite.yml)

### Docker 命令启动

#### Sqlite

```sh
docker run -d \
  --name wewe-rss \
  -p 4000:4000 \
  -e DATABASE_TYPE=sqlite \
  -e AUTH_CODE=123567 \
  -v $(pwd)/data:/app/data \
  cooderl/wewe-rss-sqlite:latest
```

#### Mysql

1. 创建docker网络

```sh
docker network create wewe-rss
```

2. 启动 MySQL 数据库

```sh
docker run -d \
  --name db \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e TZ='Asia/Shanghai' \
  -e MYSQL_DATABASE='wewe-rss' \
  -v db_data:/var/lib/mysql \
  --network wewe-rss \
  mysql:8.3.0 --mysql-native-password=ON
```

3. 启动 Server

```sh
docker run -d \
  --name wewe-rss \
  -p 4000:4000 \
  -e DATABASE_URL='mysql://root:123456@db:3306/wewe-rss?schema=public&connect_timeout=30&pool_timeout=30&socket_timeout=30' \
  -e AUTH_CODE=123567 \
  --network wewe-rss \
  cooderl/wewe-rss:latest

```

[Nginx配置参考](https://raw.githubusercontent.com/cooderl/wewe-rss/main/assets/nginx.example.conf)

### 本地部署

如果你想本地部署，请使用 `pnpm install &&  pnpm run -r build && pnpm run start:server` 命令(可以配合 pm2 来守护进程，防止被杀死)。

详细的部署步骤如下,以sqlite为例：

```shell
# 需要提前声明环境变量,因为prisma会根据环境变量生成对应的数据库连接
export DATABASE_URL="file:../data/wewe-rss.db"
export DATABASE_TYPE="sqlite"
# 删除mysql相关文件,避免prisma生成mysql连接
rm -rf apps/server/prisma
mv apps/server/prisma-sqlite apps/server/prisma
# 生成prisma client
npx prisma generate --schema apps/server/prisma/schema.prisma
# 生成数据库表
npx prisma migrate deploy --schema apps/server/prisma/schema.prisma
# 构建并运行
pnpm run -r build
pnpm run start:server

```

## 环境变量

- `DATABASE_URL` （**必填项**）数据库地址，例如 `mysql://root:123456@127.0.0.1:3306/wewe-rss`。

- `DATABASE_TYPE` 数据库类型，使用 `sqlite` 时需要填写 `sqlite`。

- `AUTH_CODE` 服务端接口请求授权码，如果设置为空字符或不设置将不启用。(`/feeds`路径不需要)

- `SERVER_ORIGIN_URL` 服务端访问地址，用于生成RSS的完整路径（外网访问时，设置为服务器的公网 IP 或者域名地址）。

- `MAX_REQUEST_PER_MINUTE` 每分钟最大请求次数，默认 60。

- `FEED_MODE` 输出模式，可选值 `fulltext`（RSS全文模式会使接口响应会变慢，占用更多内存）。

- `CRON_EXPRESSION` 定时更新订阅源Cron表达式，默认为 `35 5,17 * * *`。

- `UPDATE_DELAY_TIME` 连续更新延迟时间，减少被关小黑屋，默认为 `60s`。

- `ENABLE_CLEAN_HTML` 是否开启正文html清理，默认为 `false`。

- `PLATFORM_URL` 默认为 `https://weread.111965.xyz`, **如果在国内DNS解析问题可以使用 `https://weread.965111.xyz` 加速访问** 。

## 支持钉钉通知

进入wewe-rss-dingtalk目录按照README.md指引部署

## 使用方式

1. 进入账号管理，点击添加账号，微信扫码登录微信读书账号。
   <img width="400" src="./assets/preview2.png"/>

1. 进入公众号源，点击添加，通过提交微信公众号分享链接，订阅微信公众号。
   **（添加频率过高容易被封控，等24小时解封）**
   <img width="400" src="./assets/preview3.png"/>

## 账号状态说明

- 今日小黑屋

  > 账号被封控，等一天恢复
  > 如果账号正常，可以通过重启服务/容器清除小黑屋记录

- 禁用

  > 不使用该账号

- 失效
  > 账号登录状态失效，需要重新登录

## 本地开发

1. 安装 nodejs 18 和 pnpm；
2. 修改环境变量`cp ./apps/web/.env.local.example ./apps/web/.env`和`cp ./apps/server/.env.local.example ./apps/server/.env`
3. 执行 `pnpm install && pnpm dev` 即可。⚠️ 注意：此命令仅用于本地开发，不要用于部署！
4. 前端访问 `http://localhost:5173` ，后端访问 `http://localhost:4000`


## 风险声明

为了确保本项目的持久运行，某些接口请求将通过`weread.111965.xyz`进行转发。请放心，该转发服务不会保存任何数据。

## ❤️ 赞助

如果觉得 wewe-rss 项目对老板你有帮助，可以给我来一杯啤酒！

### PayPal

<a href="https://paypal.me/cooderl"> paypal.me/cooderl </a>

### 微信

<img style="width:300px;height:300px" src="https://r2-assets.111965.xyz/donate-wechat.jpg" alt="Donate_WeChat.jpg">


## 贡献者

<a href="https://github.com/cooderl/wewe-rss/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=cooderl/wewe-rss" />
</a>



## License

[MIT](https://raw.githubusercontent.com/cooderl/wewe-rss/main/LICENSE) @cooderl
