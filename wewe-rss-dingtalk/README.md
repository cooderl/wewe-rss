
### 修改main.py，输入dingtalk的access_token和secret

```
   access_token = '' 
   secret = ''  # 创建机器人时钉钉设置页面有提供
```

### 修改根目录下的docker-compose.yaml文件，去掉以下字段的注释
```
    # ports:
    #   - 13306:3306
```

### python3 main.py就可以运行
### 或者部署成docker，运行
```
    sudo docker-compose up -d
```