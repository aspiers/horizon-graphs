#!/bin/bash

datadir=$(dirname $0)/../../data/coinpaprika
mkdir -p $datadir

out=$datadir/coins.json
if curl -s https://api.coinpaprika.com/v1/coins > $out; then
    echo "Wrote to $out"
fi

