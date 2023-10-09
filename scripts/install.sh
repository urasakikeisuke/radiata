#!/bin/bash

# shellcheck disable=SC1091

set -x

. "$HOME"/.bashrc

curl -sSf https://rye-up.com/get | bash

echo 'source "$HOME/.rye/env"' >> "$HOME"/.bashrc
. "$HOME"/.bashrc

"$HOME"/.rye/shims/rye self update

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. "$HOME"/.bashrc

nvm install stable --latest-npm

if [ ! -e "/usr/bin/node" ]; then
  sudo ln -s $(which node) /usr/bin/
fi

if [ ! -e "/usr/bin/npm" ]; then
  sudo ln -s $(which npm) /usr/bin/
fi
