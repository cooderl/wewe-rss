#!/bin/bash

# 检查是否提供了版本号
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <new-version>"
    exit 1
fi

# 新版本号
NEW_VERSION=$1

# 更新根目录下的 package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# 更新 apps 目录下所有子包的 package.json
for d in apps/*; do
  if [ -d "$d" ] && [ -f "$d/package.json" ]; then
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$d/package.json"
  fi
done

echo "All packages updated to version $NEW_VERSION"

# 创建 Git 提交（可选）
git add .
git commit -m "Release version $NEW_VERSION"

# 创建 Git 标签
git tag "v$NEW_VERSION"

# 推送更改和标签到远程仓库
git push && git push origin --tags

echo "Git tag v$NEW_VERSION has been created and pushed"