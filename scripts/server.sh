#!/bin/bash

# shellcheck disable=SC1091

set -x

. "$HOME"/.bashrc

APP_DIR=$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")

cd "$APP_DIR" || exit

. .venv/bin/activate

"$HOME"/.rye/shims/rye sync
"$HOME"/.rye/shims/rye run prod
