const COINS = [
    // layer 1
    ['bitcoin', 'BTC'],
    ['ethereum', 'ETH'],
    ['polkadot', 'DOT'],
    ['cardano', 'ADA'],
    ['tornado-cash', 'TORN'],
    ['cosmos', 'ATOM'],
    ['avalanche-2', 'AVAX'],
    ['stellar', 'XLM'],
    ['zilliqa', 'ZIL'],
    ['secret', 'SCRT'],
    ['oasis-network', 'ROSE'],
    ['elrond-erd-2', 'EGLD'],

    // layer 2
    ['matic-network', 'MATIC'],
    ['loopring', 'LRC'],
    ['binancecoin', 'BNB'],
    ['bitpanda-ecosystem-token', 'BEST'],

    // launchpads
    ['trustswap', 'SWAP'],
    ['polkastarter', 'POLS'],
    ['duckdaodime', 'DDIM'],

    // Oracles
    ['the-graph', 'GRT'],
    ['chainlink', 'LINK'],
    ['band-protocol', 'BAND'],
    ['modefi', 'MOD'],

    // DeFi
    ['uniswap', 'UNI'],
    ['1inch', '1INCH'],
    ['sushi', 'SUSHI'],
    ['aave', 'AAVE'],
    ['maker', 'MKR'],
    ['curve-dao-token', 'CRV'],
    ['havven', 'SNX'],
    ['celsius-degree-token', 'CEL'],
    ['yearn-finance', 'YFI'],
    ['tornado-cash', 'TORN'],
    ['yield', 'YLD'],
    ['unitrade', 'TRADE'],

    // unclassified
    ['origintrail', 'TRAC'],
    ['primedao', 'PRIME'],
    ['unibright', 'UBT'],
    ['bridge-mutual', 'BMI'],
    ['umbrella-network', 'UMB'],
    ['darwinia-network-native-token', 'RING'],
    ['utrust', 'UTK'],
    ['bondly', 'BOND'],
    ['morpheus-network', 'MRPH'],
    ['parsiq', 'PRQ'],
    ['ampleforth', 'AMPL'],
    ['uma', 'UMA'],
    ['reef-finance', 'REEF'],
    ['api3', 'API3'],
    ['cyberfi', 'CFI'],
    ['butterfly-protocol-2', 'BFLY'],
    ['paid-network', 'PAID'],
    ['shopping-io', 'SPI'],
];

var context, horizon, rd, cd;

// Get one data series to which the others will be vertically aligned.
async function get_reference_data_series(coin_id, symbol) {
    let data = await fetch_coin_data(coin_id, symbol);

    let time_step = data[1].timestamp - data[0].timestamp;
    let first_timestamp = data[0].timestamp;
    let last_timestamp = data.slice(-1)[0].timestamp;

    console.log(
        `${data.length} data points for ${symbol}, ` +
            `stepping ${time_step}s ` +
            `from ${new Date(first_timestamp)} ` +
            `to ${new Date(last_timestamp)}`
    );

    return {data, time_step, first_timestamp};
}

async function fetch_coin_data(coin_id, symbol) {
    let source = `data/coingecko/${coin_id}.json`;
    console.debug(`Fetching ${symbol} from ${source}`);
    const response = await fetch(source);
    const data = await response.json();
    for (let i = 0; i < data.length; i++) {
        // Convert from milliseconds to seconds / epoch time.
        data[i].timestamp /= 1000;
    }
    return data;
}

function get_cubism_context(time_step, data_points) {
    // https://github.com/square/cubism/wiki/Context
    return cubism
        .context()
        // https://github.com/square/cubism/wiki/Context#size
        .serverDelay(0)
        .step(time_step * 1000)
        .size(data_points)
        // https://github.com/square/cubism/wiki/Context#scale
        // https://github.com/BigFatDog/cubism-es/blob/master/src/context/apiSize.js
        //.scale(1440)
        .stop();
}

function setup_axis(context) {
    d3.select("#demo").selectAll(".axis")
      .data(["top", "bottom"])
      .enter().append("div")
      .attr("class", function(d) { return d + " axis"; })
      .each(function(d) {
        // https://github.com/square/cubism/wiki/Axis
        // https://github.com/BigFatDog/cubism-es#api-breaks-v110
        context.axis()
               // .ticks(...) needs to be before .orient() to
               // avoid breaking, but still has no effect.
               // https://github.com/d3/d3-axis/blob/v1.0.12/README.md#axis_ticks
               // https://github.com/d3/d3-time/blob/v1.0.11/README.md#interval_every
               .ticks(d3.timeHour.every(12))
               // .ticks(12)

               .orient(d)
               .render(d3.select(this));
      });
}

function setup_rule(context) {
    // https://github.com/BigFatDog/cubism-es#api-breaks-v110
    context.rule().render(
      d3.select("body").append("div")
        .attr("class", "rule")
    );
}

function setup_horizon(context) {
    // https://github.com/square/cubism/wiki/Horizon
    // https://github.com/BigFatDog/cubism-es#api-breaks-v110
    // https://github.com/d3/d3-format/blob/v2.0.0/README.md#format
    let horizon = context.horizon();
    horizon
        .format(d3.format("+,.2p"))
        // .scale(784)
        .colors(['#b30000', '#c64040', '#d98080', '#ecbfbf', '#bae4b3', '#74c476', '#31a354', '#006d2c'])
        .render(
            d3.selectAll(".horizon")
        );
    return horizon;
}

function setup_focus_handler(context) {
    // Set the 'right' CSS position property for all values
    // to be proportional to the value's index.
    context.on("focus", function(i) {
      d3.selectAll(".value")
        .style("right", i == null ? null : context.size() - i + "px");
    });
}

async function chart_coins(context, coins, ref_data) {
    let coin_data = coins.map(
        ([coin_id, symbol]) =>
        metric_for_coin(context, coin_id, symbol, ref_data)
    );
    cd = coin_data;

    d3.select("body").selectAll(".horizon")
      .data(coin_data)
      .enter().insert("div", ".bottom")
      .attr("class", "horizon");
}

// This should return a context.metric(request, name) object as
// described in https://github.com/square/cubism/wiki/Context#metric.
function metric_for_coin(context, coin_id, symbol, ref_data) {
    // TODO: Replace this with context.graphite and graphite.metric?
    return context.metric(function(start, stop, step, callback) {
        // This request function should retrieve the metric's data and
        // then invoke the passed callback to deliver the data back to
        // cubism.
        populate_metric_data(coin_id, symbol, ref_data, callback);
    }, symbol);
}

async function populate_metric_data(coin_id, symbol, ref_data,
                                    callback) {
    let data = await fetch_coin_data(coin_id, symbol);
    let prices = aligned_prices(coin_id, symbol, data, ref_data);
    callback(null, prices.slice(-context.size()));
}

function aligned_prices(coin_id, symbol, data, ref_data) {
    let prices = [];
    for (let i = 0; ref_data[i].timestamp < data[0].timestamp; i++) {
        prices.push(0);
    }
    if (prices.length > 0) {
        console.debug(
            `${symbol} started at ${data[0].timestamp} ` +
                `after ${ref_data[0].timestamp}; ` +
                `inserted ${prices.length} blanks to align ${symbol}`
        );
    }

    let firstPrice = data[0].price;
    data.forEach(function(d) {
        prices.push((d.price - firstPrice) / firstPrice);
    });
    return prices;
}

async function main() {
    let { data: ref_data, time_step, first_timestamp } =
        await get_reference_data_series('bitcoin', 'BTC');
    rd = ref_data;
    context = get_cubism_context(time_step, ref_data.length);
    setup_axis(context);
    setup_rule(context);

    chart_coins(context, COINS, ref_data);
    setup_horizon(context);
    setup_focus_handler(context);
}

main();
