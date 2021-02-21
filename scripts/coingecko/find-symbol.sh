#!/bin/bash

datadir=$(dirname $0)/../../data/coingecko
mkdir -p $datadir

jq '. | map(select(.symbol == "'"$1"'"))' $datadir/coins.json
