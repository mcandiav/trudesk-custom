# HelpDesk At-Once-AI — Docker build optimized for layer cache.
# Changing CSS/views/JS app code should NOT re-run yarn install.

FROM node:16.14-alpine AS builder

WORKDIR /usr/src/trudesk

RUN apk add --no-cache bash make gcc g++ python3 git

# 1) Manifests + Yarn Berry binary (cached unless dependencies change)
COPY package.json yarn.lock .yarnrc.yml .yarnclean ./
COPY .yarn/releases .yarn/releases

# 2) Install deps once (heavy) — reused across branding/code deploys
RUN yarn plugin import workspace-tools \
  && yarn workspaces focus --all --production \
  && cp -R node_modules prod_node_modules \
  && yarn install \
  && rm -rf .yarn/cache

# 3) App source (invalidates only from here on typical UI/branding changes)
ARG GIT_SHA=
ENV TD_GIT_COMMIT=$GIT_SHA
COPY . .

# Stamp VERSION_APP@HASH_GIT then build frontend assets
RUN if [ -n "$GIT_SHA" ]; then printf '%.7s\n' "$GIT_SHA" > .git-commit; \
    elif [ -f .git-commit ]; then true; \
    else echo unknown > .git-commit; fi \
  && yarn build \
  && rm -rf node_modules \
  && mv prod_node_modules node_modules \
  && rm -rf .yarn/cache test .github .circleci

FROM node:16.14-alpine

WORKDIR /usr/src/trudesk

RUN apk add --no-cache ca-certificates bash mongodb-tools \
  && rm -rf /tmp/*

COPY --from=builder /usr/src/trudesk .

EXPOSE 8118

CMD ["/bin/bash", "/usr/src/trudesk/startup.sh"]
