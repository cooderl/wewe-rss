FROM python:3.8.12-slim

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive

CMD python3 /app/main.py
