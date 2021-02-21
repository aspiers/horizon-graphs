#!/bin/bash

symbols=BTC,ETH,ADA,DOT
mode=sandbox

die () {
    echo >&2 "$@"
    exit 1
}

init_vars () {
    # https://coinmarketcap.com/api/documentation/v1/#section/Quick-Start-Guide
    case $mode in
        pro)
            api_key=$CMC_API_KEY  # needs an export
            cmc_endpoint=https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical
            start="2021-01-20T00:00:00Z"
            end="2021-02-20T00:00:00Z"
            ;;
        sandbox)
            api_key=b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c
            endpoint=https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical
            start="2019-08-19T00:00:00Z"
            end="2019-08-20T00:00:00Z"
            ;;
        *)
            die "Huh"
            ;;
    esac

    datadir=data/$mode
}

api_fetch () {
    curl -s \
         -H "X-CMC_PRO_API_KEY: $api_key" \
         -H "Accept: application/json" \
         -G "$endpoint" \
         -d symbol="$symbols" \
         -d convert=USD \
         -d time_start="$start" \
         -d time_end="$end" \
         -d interval=5m \
         -d aux=price
}

munge () {
    jq '.data | map({
                      symbol,
                      quotes: .quotes |
                        map({timestamp, price: .quote.USD.price})
                    })'
}

main () {
    init_vars

    mkdir -p $datadir

    raw=$datadir/raw.json
    if ! api_fetch > $raw; then
        die "API fetch failed; aborting"
    fi

    out=$datadir/prices.json
    if munge < $raw > $out; then
        echo "Downloaded symbols:"
        jq '. | map(.symbol)' $out
    fi
}

main "$@"

