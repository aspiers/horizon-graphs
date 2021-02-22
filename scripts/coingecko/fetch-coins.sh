#!/bin/bash

# use find-symbol.sh
coins=(
    # layer 1
    bitcoin
    ethereum
    cardano
    polkadot
    cosmos
    avalanche-2
    stellar
    zilliqa
    secret
    oasis-network
    elrond-erd-2

    # layer 2
    matic-network
    loopring
    binancecoin
    bitpanda-ecosystem-token

    # launchpads
    trustswap
    polkastarter
    duckdaodime

    # Oracles
    the-graph
    chainlink
    band-protocol
    modefi

    # DeFi
    uniswap
    1inch
    sushi
    aave
    maker
    curve-dao-token
    havven
    celsius-degree-token
    yearn-finance
    tornado-cash
    yield
    unitrade

    # unclassified
    origintrail
    primedao
    unibright
    bridge-mutual
    umbrella-network
    darwinia-network-native-token
    utrust
    bondly
    morpheus-network
    parsiq
    ampleforth
    uma
    reef-finance
    api3
    cyberfi
    butterfly-protocol-2
    paid-network
    shopping-io
)

start="2021-01-20T00:00:00Z"
end="2021-02-20T00:00:00Z"
epoch_start=$(date +%s -d "$start")
epoch_end=$(date +%s -d "$end")
interval=1h

datadir=$(dirname $0)/../../data/coingecko
mkdir -p $datadir

fetch_coin () {
    coin_id=$1
    endpoint=https://api.coingecko.com/api/v3/coins/${coin_id}/market_chart/range
    params="vs_currency=usd;from=$epoch_start;to=$epoch_end"

    echo -e >&2 "\nFetching $coin_id from $start to $end ..."
    echo >&2 "   $ curl -s $endpoint?$params"
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
        local raw=$datadir/raw/$coin.json
        if ! fetch_coin $coin > $raw; then
            die "API fetch of $coin failed; aborting"
        fi
        local out=$datadir/$coin.json
        if ! munge < $raw > $out; then
            die "Munge of $coin failed; aborting"
        fi
        echo "   > Wrote to $out"
        local len=$( jq '. | length' $out )
        local first=$( jq '.[0].timestamp / 1000' $out )
        local last=$( jq '.[-1].timestamp / 1000' $out )
        local epoch_first=$( date -d "@$first" )
        local epoch_last=$( date -d "@$last" )
        echo "   > $len data points from $epoch_first to $epoch_last"
    done
    exit 0
}

main "$@"

