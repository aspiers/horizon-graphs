var context, horizon;

d3.json("data/CMC/sandbox/prices.json").then(
  function(data) {
    let coins = data.map(function(coin) {
      let firstPrice = coin.quotes[0].price;
      return {
        symbol: coin.symbol,
        quotes: coin.quotes.map(function(quote) {
          return [
            new Date(quote.timestamp),
            quote.price
            // %age change from first quote
            // (quote.price - first) / first
          ];
        })
      };
    });
    let timeStep = coins[0].quotes[1][0] - coins[0].quotes[0][0];
    let dataPoints = coins[0].quotes.length;
    console.log(
      `${dataPoints} data points for ${coins.length} coins, ` +
      `stepping ${timeStep / 1000}s ` +
      `from ${coins[0].quotes[0][0]} to ${coins[0].quotes.slice(-1)[0][0]}`
    );

    // https://github.com/square/cubism/wiki/Context
    context = cubism
      .context()
      .serverDelay(0)
      .step(timeStep)
      .size(dataPoints)
      // https://github.com/square/cubism/wiki/Context#scale
      // https://github.com/BigFatDog/cubism-es/blob/master/src/context/apiSize.js
      //.scale(1440)
      .stop();

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

    // https://github.com/BigFatDog/cubism-es#api-breaks-v110
    context.rule().render(
      d3.select("body").append("div")
        .attr("class", "rule")
    );

    d3.select("body").selectAll(".horizon")
      .data(coins.map(coin_metric))
      .enter().insert("div", ".bottom")
      .attr("class", "horizon");

    // https://github.com/square/cubism/wiki/Horizon
    // https://github.com/BigFatDog/cubism-es#api-breaks-v110
    // https://github.com/d3/d3-format/blob/v2.0.0/README.md#format
    horizon = context.horizon();
    horizon
      .format(d3.format("+,.2p"))
      //.extent([0, 1000])
      .render(
        d3.selectAll(".horizon")
      );
    console.log(horizon.extent());

    // FIXME: what does this do?
    context.on("focus", function(i) {
      d3.selectAll(".value")
        .style("right", i == null ? null : context.size() - i + "px");
    });

    // Replace this with context.graphite and graphite.metric!
    function coin_metric(coin) {
      // var format = d3.time.format("%d-%b-%y");
      return context.metric(function(start, stop, step, callback) {
        let rows = coin.quotes; // .reverse();
        console.log(`Got ${rows.length} quotes for ${coin.symbol}`);
        let date = rows[0][0];
        let compare = rows[dataPoints - 1][1];
        let value = rows[0][1];
        let values = [value];
        rows.forEach(function(d) {
          // https://github.com/d3/d3-time/blob/v1.0.11/README.md
          while ((date = d3.timeDay.offset(date, 1)) < d[0])
            values.push(value);
          values.push(value = (d[1] - compare) / compare);
        });
        callback(null, values.slice(-context.size()));
      }, coin.symbol);
    }
  }
);
