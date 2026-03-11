EDITOR_IMAGE ?= registry.gitlab.com/faktofon-code/verifier/editor
AGENT_IMAGE ?= registry.gitlab.com/faktofon-code/verifier/agent
COMMIT_TAG ?= $(shell git rev-parse --short HEAD)

build-editor:
	docker build \
	    -t $(EDITOR_IMAGE):$(COMMIT_TAG) \
	    -t $(EDITOR_IMAGE):latest \
	     ./client

push-editor:
	docker push $(EDITOR_IMAGE):latest

build-agent:
	docker build \
	    -t $(AGENT_IMAGE):$(COMMIT_TAG) \
	    -t $(AGENT_IMAGE):latest \
	     ./agent

push-agent:
	docker push $(AGENT_IMAGE):latest

build: build-agent build-editor push-agent push-editor
