#!/bin/bash

datadir=$(dirname $0)/../data

jq '. | map(select(.symbol == "'"$1"'"))' $datadir/coins.json
