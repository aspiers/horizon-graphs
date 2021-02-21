#!/bin/bash

datadir=$(dirname $0)/../../data/coingecko
mkdir -p $datadir

out=$datadir/coins.json
if curl -s https://api.coingecko.com/api/v3/coins/list?include_platform=true > $out; then
    echo "Wrote to $out"
fi

