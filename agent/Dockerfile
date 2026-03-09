FROM python:3.13-slim AS base

WORKDIR /app

ENV PYTHONPATH=/app/src

COPY pyproject.toml ./uv.lock ./

RUN pip install uv

FROM base AS deps

RUN uv pip install --system -r pyproject.toml

FROM deps AS app

# can be overriden in runtime
ENV MLFLOW_TRACKING_URI=""
ENV MLFLOW_EXPERIMENT_NAME="production-genai-app"
ENV MLFLOW_ENABLE_ASYNC_TRACE_LOGGING=true

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
