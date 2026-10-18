import json
import os
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).parent

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'web'), **kwargs)

    def do_GET(self):
        if self.path == '/api/status':
            self.reply(200, {'ai': bool(os.getenv('GAME_AI_KEY'))})
        else:
            super().do_GET()

    def reply(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/api/story':
            return self.reply(404, {'error': 'Not found'})
        if not os.getenv('GAME_AI_KEY'):
            return self.reply(503, {'error': '尚未配置 AI 接口，请先体验本地演示。'})
        try:
            size = int(self.headers.get('Content-Length', 0))
            if size > 32000:
                return self.reply(413, {'error': '输入过长'})
            data = json.loads(self.rfile.read(size))
            prompt = ('你是中文校园生活模拟器主持人。主角是初一学生。只写适龄校园生活，禁止未成年人色情。'
                      '尊重玩家自由行动，不替玩家做决定。延续给定历史，不凭空改变既定事实。'
                      '行动不一定成功，结合精力和钱包判断可行性。每次推进一个小场景，文字150至300字。'
                      '只返回JSON：{"text":"剧情","choices":["行动1","行动2","行动3"],'
                      '"delta":{"energy":0,"stress":0,"money":0,"friend":0}}。'
                      'energy和stress每次变化不超过10，friend不超过5，money不超过30；无关项为0。')
            payload = {'model': os.getenv('GAME_AI_MODEL', 'gpt-4.1-mini'),
                       'messages': [{'role': 'system', 'content': prompt},
                                    {'role': 'user', 'content': json.dumps(data, ensure_ascii=False)}],
                       'response_format': {'type': 'json_object'}}
            req = urllib.request.Request(os.getenv('GAME_AI_BASE_URL', 'https://api.openai.com/v1').rstrip('/') + '/chat/completions',
                data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + os.environ['GAME_AI_KEY']})
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.loads(response.read())
            story = json.loads(result['choices'][0]['message']['content'])
            if not isinstance(story.get('text'), str) or not isinstance(story.get('choices'), list):
                raise ValueError('Invalid story')
            self.reply(200, story)
        except Exception:
            self.reply(502, {'error': 'AI 暂时没有成功回应，进度未改变，请重试或切换演示模式。'})

if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', int(os.getenv('PORT', '3000'))), Handler).serve_forever()
