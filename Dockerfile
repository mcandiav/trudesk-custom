#FROM golang:1.17-alpine AS gcsfuse
#RUN apk add --no-cache git
#ENV GOPATH /go
#RUN go install github.com/googlecloudplatform/gcsfuse@latest

FROM node:16.14-alpine AS builder

ARG GIT_SHA=
ENV TD_GIT_COMMIT=$GIT_SHA

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY . /usr/src/trudesk

# Stamp VERSION_APP@HASH_GIT source: build-arg GIT_SHA, else git, else unknown
RUN apk add --no-cache --update bash make gcc g++ python3 git \
  && if [ -n "$GIT_SHA" ]; then printf '%.7s\n' "$GIT_SHA" > .git-commit; \
     elif [ -d .git ]; then git rev-parse --short=7 HEAD > .git-commit; \
     elif [ -f .git-commit ]; then true; \
     else echo unknown > .git-commit; fi

RUN yarn plugin import workspace-tools
RUN yarn workspaces focus --all --production
RUN cp -R node_modules prod_node_modules
RUN yarn install
RUN yarn build
RUN rm -rf node_modules && mv prod_node_modules node_modules
RUN rm -rf .yarn/cache

FROM node:16.14-alpine
WORKDIR /usr/src/trudesk
RUN apk add --no-cache ca-certificates bash mongodb-tools && rm -rf /tmp/*
COPY --from=builder /usr/src/trudesk .
#COPY --from=gcsfuse /go/bin/gcsfuse /usr/local/bin

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]
