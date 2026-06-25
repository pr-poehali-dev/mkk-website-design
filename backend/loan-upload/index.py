"""Загрузка файла справки о доходах в S3."""
import json
import os
import base64
import uuid
import boto3

def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    file_b64 = body.get('file')
    mime = body.get('mime', 'image/jpeg')

    if not file_b64:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'file обязателен'})}

    data = base64.b64decode(file_b64)
    ext = mime.split('/')[-1].replace('jpeg', 'jpg')
    key = f"income_docs/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'url': cdn_url})}
