# EasePas: A simple web-bbs-like inner-network copy & share tool

## Usage:

In shell:
```shell
npm install
nodejs main.js
```

In browser
```shell
firefox http://localhost:8818/
```

## Config:

Nignx config for /etc/nginx/sites-enabled/default:

```javascript
// server:
location /pasbase   {
    proxy_pass "http://127.0.0.1:8818/";
    client_max_body_size 80M;
    proxy_redirect off;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $http_host;
    access_log off;
    log_not_found off;
}
```
