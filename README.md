# Baubler

This codebase started as [heroku-examples/node-ws-test](https://github.com/heroku-examples/node-ws-test) - thanks heroku


# Running Locally

Requirements:

* redis
* mongodb

``` bash
npm install
node server.js
```

# Running on Heroku

``` bash
heroku create
heroku labs:enable websockets
heroku addons:add redistogo
heroku addons:add mongolab

git push heroku master
heroku open
```