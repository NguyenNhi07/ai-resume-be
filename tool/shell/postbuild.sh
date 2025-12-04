#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

cp package.json dist
cp -r template dist
