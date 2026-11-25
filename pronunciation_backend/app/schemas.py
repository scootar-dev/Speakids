from typing import Literal
from pydantic import BaseModel, Field

Exercise = Literal['word', 'phrase', 'sentence', 'letter_name', 'phonics']
Status = Literal['assessed', 'uncertain', 'invalid_audio', 'no_speech', 'unsupported', 'model_unavailable', 'processing_error']

class Feedback(BaseModel):
    title: str
    message: str
    focus_phoneme: str | None = None
    suggested_action: str = 'replay_and_retry'

class Phone(BaseModel):
    phoneme: str
    score: float | None = None
    status: Literal['uncertain', 'supported', 'needs_practice'] = 'uncertain'
    start_seconds: float | None = None
    end_seconds: float | None = None
    acoustic_log_margin: float | None = None

class Assessment(BaseModel):
    schema_version: str = '1.0'
    assessment_status: Status
    target_text: str
    recognized_text: str | None = None
    model_version: str
    overall_score: float | None = Field(default=None, ge=0, le=100)
    target_match: bool | None = None
    phonemes: list[Phone] = Field(default_factory=list)
    feedback: Feedback
    can_pass: bool = False
    evidence_type: str = 'uncalibrated_ctc_acoustics'
    recognized_phonemes: list[str] = Field(default_factory=list)
    reason: str | None = None
