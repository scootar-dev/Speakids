import io
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
from app.main import create_app
from app.settings import Settings
from app.services.alignment import PhonemeAligner
from app.services.audio import AudioPreprocessor, AudioProblem
from app.services.assessment import FeedbackEngine
import pytest

class UnavailableModel:
    ready=False

def wav(silence=False,seconds=1):
    out=io.BytesIO()
    x=np.zeros(int(16000*seconds)) if silence else .1*np.sin(2*np.pi*220*np.arange(int(16000*seconds))/16000)
    sf.write(out,x,16000,format='WAV',subtype='PCM_16')
    return out.getvalue()

@pytest.fixture
def client():
    with TestClient(create_app(Settings(dev_no_auth=True),UnavailableModel())) as c: yield c

def post(client,data,mode='word',target='three'):
    return client.post('/api/v1/pronunciation/assess',files={'audio':('test.wav',data,'audio/wav')},data={'target_text':target,'exercise_type':mode})

def test_health_and_ready(client):
    assert client.get('/health').status_code==200
    assert client.get('/ready').status_code==503
    assert client.get('/api/v1/models/info').json()['calibrated'] is False

@pytest.mark.parametrize('data,status',[(b'bad','invalid_audio'),(b'','invalid_audio'),(wav(True),'no_speech'),(wav(),'model_unavailable'),(wav(seconds=13),'invalid_audio')],ids=['corrupt','empty','silence','valid-unavailable','too-long'])
def test_recordings(client,data,status):
    result=post(client,data).json()
    assert result['assessment_status']==status
    assert result['can_pass'] is False and result['overall_score'] is None

def test_guided_letters(client): assert post(client,wav(),'letter_name','A').json()['assessment_status']=='unsupported'
def test_validation(client):
    assert post(client,wav(),target='<script>').status_code==422
    assert post(client,wav(),mode='fake').status_code==422
    assert post(client,b'x'*2_100_000).status_code==413

def test_auth_required():
    with TestClient(create_app(Settings(dev_no_auth=False),UnavailableModel())) as client:
        assert post(client,wav()).status_code==401

def test_rate_limit():
    with TestClient(create_app(Settings(dev_no_auth=True,requests_per_minute=1),UnavailableModel())) as client:
        assert post(client,wav()).status_code==200
        assert post(client,wav()).status_code==429

def test_alignment_repeated_phone():
    # Synthetic logits exclusively for testing CTC path topology.
    lp=np.log(np.array([[.1,.9],[.9,.1],[.1,.9]]))
    assert PhonemeAligner().align(lp,[1,1],0)==[[0],[2]]
    with pytest.raises(ValueError): PhonemeAligner().align(lp[:1],[1,1],0)

def test_feedback_never_diagnoses_uncertainty():
    feedback=FeedbackEngine().feedback('uncertain')
    assert feedback.focus_phoneme is None

def test_model_unavailable_real_loader(client):
    from app.services.model import AcousticCTCModel
    assert AcousticCTCModel(Settings(model_path='')).ready is False
