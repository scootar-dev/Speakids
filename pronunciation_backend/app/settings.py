import os
from dataclasses import dataclass, field

@dataclass
class Settings:
    model_path: str = field(default_factory=lambda: os.getenv('MODEL_PATH', ''))
    model_version: str = field(default_factory=lambda: os.getenv('MODEL_VERSION', 'speakids-ctc-research-v1'))
    device: str = field(default_factory=lambda: os.getenv('MODEL_DEVICE', 'cpu'))
    model_allow_pickle: bool = field(default_factory=lambda: os.getenv('MODEL_ALLOW_PICKLE', 'false').lower() == 'true')
    issuer: str = field(default_factory=lambda: os.getenv('JWT_ISSUER', ''))
    audience: str = field(default_factory=lambda: os.getenv('JWT_AUDIENCE', 'authenticated'))
    jwks_url: str = field(default_factory=lambda: os.getenv('JWT_JWKS_URL', ''))
    dev_no_auth: bool = field(default_factory=lambda: os.getenv('DEV_NO_AUTH', 'false').lower() == 'true')
    origins: list[str] = field(default_factory=lambda: os.getenv('CORS_ORIGINS', 'http://localhost:3000,https://appassets.androidplatform.net').split(','))
    max_bytes: int = 2_000_000
    max_seconds: float = 12.0
    requests_per_minute: int = 12
