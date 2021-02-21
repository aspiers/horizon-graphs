#!/bin/bash

# use find-symbol.sh
coins=(
    bitcoin ethereum cardano polkadot
    tornado-cash
)

start=$(edate "2021-01-20T00:00:00Z")
end=$(edate "2021-02-20T00:00:00Z")
interval=1h

datadir=$(dirname $0)/../../data/coingecko
mkdir -p $datadir

fetch_coin () {
    coin_id=$1
    endpoint=https://api.coingecko.com/api/v3/coins/${coin_id}/market_chart/range
    params="vs_currency=usd;from=$start;to=$end"

    echo >&2 curl -s "$endpoint?$params"
    curl -s "$endpoint?$params"
}

munge () {
    jq '.prices | map({timestamp: .[0], price: .[1]})'
}

die () {
    echo >&2 "$@"
    exit 1
}

main () {
    mkdir -p $datadir/raw

    for coin in ${coins[@]}; do
        raw=$datadir/raw/$coin.json
        if ! fetch_coin $coin > $raw; then
            die "API fetch of $coin failed; aborting"
        fi
        out=$datadir/$coin.json
        if ! munge < $raw > $out; then
            die "Mungle of $coin failed; aborting"
        fi
        len=$( jq '. | length' $out )
        echo "Wrote $len data points to $out"
    done
    exit 0
}

main "$@"

