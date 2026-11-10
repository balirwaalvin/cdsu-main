# CDSU website: static files served by Caddy (deployed on Railway)
FROM docker.io/library/caddy:2.8.4-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY *.html /srv/
COPY css /srv/css
COPY js /srv/js
COPY assets /srv/assets
COPY admin /srv/admin
COPY mail /srv/mail
