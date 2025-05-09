# 需要提前声明环境变量,因为prisma会根据环境变量生成对应的数据库连接
export DATABASE_URL="mysql://root:password@127.0.0.1:3306/wewe-rss"
export DATABASE_TYPE="mysql"
# 删除mysql相关文件,避免prisma生成mysql连接
#rm -rf apps/server/prisma
#mv apps/server/prisma-sqlite apps/server/prisma
# 生成prisma client
npx prisma generate --schema apps/server/prisma/schema.prisma
# 生成数据库表
npx prisma migrate deploy --schema apps/server/prisma/schema.prisma
# 构建并运行
pnpm run -r build
pnpm run start:server