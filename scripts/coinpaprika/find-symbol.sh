#!/bin/bash

datadir=$(dirname $0)/../../data/coinpaprika
mkdir -p $datadir

jq '. | map(select(.symbol == "'"$1"'"))' $datadir/coins.json
