AGENT_IMAGE ?= registry.gitlab.com/faktofon-code/verifier/agent
COMMIT_TAG ?= $(shell git rev-parse --short HEAD)

docker-build-agent:
	docker build \
	    -t $(AGENT_IMAGE):$(COMMIT_TAG) \
	    -t $(AGENT_IMAGE):latest \
	     ./agent

docker-push-agent:
	docker push $(AGENT_IMAGE):latest

build-agent: docker-build-agent docker-push-agent
