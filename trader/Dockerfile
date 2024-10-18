FROM python:latest

WORKDIR /usr/src/app

COPY requirements.txt .

RUN python -m venv venv

RUN ./venv/bin/pip install --upgrade pip && \
    ./venv/bin/pip install -r requirements.txt

COPY . .

ENV PATH="/usr/src/app/venv/bin:$PATH"

CMD ["python", "opportunity_detector.py"]
