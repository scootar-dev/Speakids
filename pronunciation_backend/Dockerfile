FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 espeak-ng && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements-model.txt
COPY app ./app
RUN useradd --uid 10001 --create-home engine
USER engine
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
