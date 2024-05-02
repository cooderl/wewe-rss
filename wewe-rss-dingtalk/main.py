import mysql.connector
import requests
import json
import os
import time
from datetime import datetime, timedelta
import pytz
from dingtalkchatbot.chatbot import DingtalkChatbot, ActionCard, FeedLink, CardItem

def get_subjects_json():
    # 连接MySQL数据库
    mydb = mysql.connector.connect(
        host="localhost",
        port="13306",
        user="root",
        password="123456",
        database="wewe-rss"
    )
    # 查询符合条件的数据, 用created_at来判断，因为publish_time是发文时间，rss更新时间会滞后
    mycursor = mydb.cursor()
    query = """SELECT a.id, a.title, a.pic_url, a.publish_time, b.mp_name
        FROM articles AS a, feeds AS b
        WHERE a.mp_id = b.id
        AND a.created_at >= NOW() - INTERVAL 12 HOUR 
        ORDER BY a.publish_time DESC"""
        # 4hour +8 to fix created time is UTC time.
    mycursor.execute(query)
    results = mycursor.fetchall()

    # 组装数据为JSON格式
    data = []
    for result in results:
        subject = {
            "id": result[0],
            "title": result[1],
            "pic_url": result[2],
            "publish_time": result[3],
            "mp_name": result[4]
        }
        data.append(subject)

    json_data = json.dumps(data, indent=4)
    print(json_data)
    return json_data

def dingbot_markdown(access_token, secret, rss_list):
    new_webhook = f'https://oapi.dingtalk.com/robot/send?access_token={access_token}'
    xiaoding = DingtalkChatbot(new_webhook, secret=secret, pc_slide=True, fail_notice=False)

    text = []
    for data in rss_list:
        # 创建CardItem对象
        mp_name = data['mp_name']
        url = 'https://mp.weixin.qq.com/s/' + str(data["id"])
        unix_timestamp = data['publish_time']
        # 将 Unix 时间戳转换为北京时间
        #转换成localtime
        time_local = time.localtime(unix_timestamp)
        #转换成新的时间格式(2016-05-05 20:28:54)
        beijing_time = time.strftime("%Y-%m-%d %H:%M:%S",time_local)
        text_content = f'> **{mp_name}** [' + data["title"] + '](' + url + ') ' + str(beijing_time) + '\n'
        # Markdown消息@指定用户
        text.append(text_content)

    title = '## 微信公众号<最近4小时更新> \n\n'
    markdown_text = title +  '\n'.join(text)
    print(markdown_text)
    res = xiaoding.send_markdown(title=title, text=markdown_text)
    print(f"send sucess, res: {res}")


def send_dingtalk_msg(access_token, secret):
    data = get_subjects_json()
    rss_list = json.loads(data)
    if len(rss_list) != 0:
        dingbot_markdown(access_token, secret, rss_list) 

if __name__ == '__main__':

    access_token = ''
    secret = ''  # 创建机器人时钉钉设置页面有提供

    while True:
        send_dingtalk_msg(access_token, secret)
        time.sleep( 4 * 60 * 60 ) # run every 4 hours
