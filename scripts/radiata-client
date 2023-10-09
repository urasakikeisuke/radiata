#!/bin/bash

# shellcheck disable=SC1091

set -x

. "$HOME"/.bashrc

APP_DIR=$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")

cd "$APP_DIR" || exit

/usr/bin/npm run build
/usr/bin/npm run start
