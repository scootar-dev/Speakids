import asyncio
import logging
import re
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from functools import partial
import jwt
from fastapi import FastAPI, File, Form, UploadFile, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from .settings import Settings
from .schemas import Assessment, Exercise
from .services.model import AcousticCTCModel
from .services.assessment import AssessmentService

logger = logging.getLogger('speakids')

class UploadLimit:
    def __init__(self, app, limit): self.app, self.limit = app, limit
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http': return await self.app(scope, receive, send)
        size = 0
        async def bounded():
            nonlocal size
            message = await receive()
            size += len(message.get('body', b''))
            if size > self.limit: raise HTTPException(413, 'Recording too large')
            return message
        headers = dict(scope['headers'])
        try:
            declared = int(headers.get(b'content-length', b'0'))
        except ValueError:
            return await JSONResponse({'detail':'Invalid Content-Length'}, status_code=400)(scope,receive,send)
        if declared > self.limit:
            return await JSONResponse({'detail':'Recording too large'}, status_code=413)(scope,receive,send)
        await self.app(scope, bounded, send)

def create_app(settings=None, model=None):
    settings = settings or Settings()
    limiter = defaultdict(deque)
    jwks = jwt.PyJWKClient(settings.jwks_url) if settings.jwks_url else None

    @asynccontextmanager
    async def lifespan(app):
        app.state.model = model or await run_in_threadpool(AcousticCTCModel, settings)
        app.state.service = AssessmentService(settings, app.state.model)
        app.state.busy = asyncio.Lock()
        logger.info('Pronunciation engine ready=%s version=%s', app.state.model.ready, settings.model_version)
        yield

    app = FastAPI(title='SpeaKids Pronunciation Engine', version='1.0', lifespan=lifespan)
    app.add_middleware(UploadLimit, limit=settings.max_bytes + 16384)
    app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_methods=['POST','GET'], allow_headers=['Authorization','Content-Type'])

    async def authorize(request: Request):
        if settings.dev_no_auth:
            subject = request.client.host if request.client else 'local'
        else:
            header = request.headers.get('authorization','')
            if not jwks or not settings.issuer or not header.startswith('Bearer '):
                raise HTTPException(401, 'Valid short-lived bearer token required')
            token = header[7:]
            try:
                key = await run_in_threadpool(jwks.get_signing_key_from_jwt, token)
                claims = jwt.decode(token,key.key,algorithms=['RS256','ES256'],audience=settings.audience,issuer=settings.issuer,options={'require':['exp','sub','iss','aud']})
                subject = claims['sub']
            except Exception:
                raise HTTPException(401, 'Session expired or invalid') from None
        now = time.monotonic()
        if len(limiter)>10000:
            for key in list(limiter):
                if not limiter[key] or limiter[key][-1] < now-60: del limiter[key]
            if len(limiter)>10000: raise HTTPException(503,'Rate limiter capacity reached')
        bucket = limiter[subject]
        while bucket and bucket[0] < now-60: bucket.popleft()
        if len(bucket)>=settings.requests_per_minute: raise HTTPException(429,'Please wait before trying again')
        bucket.append(now)

    @app.get('/health')
    def health(): return {'status':'ok'}

    @app.get('/ready')
    def ready(request: Request):
        return JSONResponse({'ready':request.app.state.model.ready},status_code=200 if request.app.state.model.ready else 503)

    @app.get('/api/v1/models/info')
    def info(request: Request):
        return {'model_version':settings.model_version,'ready':request.app.state.model.ready,
                'reference_accent':'en-US','calibrated':False,'automatic_mastery':False,
                'model':'facebook/wav2vec2-lv-60-espeak-cv-ft','license':'Apache-2.0',
                'evidence':'CTC-aligned log posterior margin; not a human pronunciation score'}

    @app.post('/api/v1/pronunciation/assess',response_model=Assessment,dependencies=[Depends(authorize)])
    async def assess(request: Request, audio: UploadFile=File(...), target_text: str=Form(...,min_length=1,max_length=160),
                     exercise_type: Exercise=Form(...), exercise_id: str|None=Form(default=None,max_length=100)):
        target = target_text.strip()
        if not re.fullmatch(r"[A-Za-z][A-Za-z '\-.,!?]*",target):
            raise HTTPException(422,'Use English target text, maximum 160 characters')
        try:
            data = await audio.read(settings.max_bytes+1)
        finally:
            await audio.close()
        if len(data)>settings.max_bytes: raise HTTPException(413,'Recording too large')
        if request.app.state.busy.locked(): raise HTTPException(503,'Assessment busy. Retry shortly.')
        async with request.app.state.busy:
            return await run_in_threadpool(partial(request.app.state.service.assess,data,target,exercise_type))
    return app

app = create_app()
