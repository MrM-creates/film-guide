#!/bin/bash
git checkout --ours index.html
git checkout --ours films.js
git add index.html films.js
git rebase --continue
