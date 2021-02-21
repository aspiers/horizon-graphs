#!/bin/bash

# use find-symbol.sh
coins=(
    btc-bitcoin eth-ethereum ada-cardano dot-polkadot
    torn-tornado-cash
)

start="2021-01-20T00:00:00Z"
end="2021-02-20T00:00:00Z"
interval=1h

datadir=$(dirname $0)/../../data/coinpaprika
mkdir -p $datadir

fetch_coin () {
    coin_id=$1
    #endpoint=https://api.coinpaprika.com/v1/coins/${coin_id}/ohlcv/historical
    endpoint=https://api.coinpaprika.com/v1/tickers/${coin_id}/historical
    params="quote=usd;start=$start;end=$end;limit=366;interval=$interval"

    # https://api.coinpaprika.com/#tag/Coins/paths/~1coins~1{coin_id}~1ohlcv~1historical/get
    echo >&2 curl -s "$endpoint?$params"
    curl -s "$endpoint?$params"
}

munge () {
    jq '. | map({timestamp, price})'
}

die () {
    echo >&2 "$@"
    exit 1
}

main () {
    mkdir -p $datadir

    for coin in ${coins[@]}; do
        out=$datadir/$coin.json
        if ! fetch_coin $coin | munge > $out; then
            die "API fetch of $coin failed; aborting"
        fi
        len=$( jq '. | length' $out )
        echo "Wrote $len data points to $out"
    done
    exit 0
}

main "$@"

