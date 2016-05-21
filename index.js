var pixel = require('node-pixel')
var five = require('johnny-five')
var Forecast = require('forecast')
var CronJob = require('cron').CronJob

var board = new five.Board()
var strip = null
var apikey = require('./.api_key.json')
var position = [ 48.9894, -122.7753] // Semiahmoo
var forecast = new Forecast({
  service: 'forecast.io',
  key: apikey,
  units: 'celcius',
  cache: true,
  ttl: {
    minutes: 15
  }
})
var temperature_color = '#333333'
var ranges = [
  [ 0, 'blue' ],
  [ 5, 'light-blue' ],
  [ 10, 'grey' ],
  [ 20, 'yellow' ],
  [ 25, 'orange' ],
  [ 30, 'red' ]
]

function getColor(temperature) {
  var color = ranges.reduce((p, c) => {
    return temperature > c[0] ? c : p
  })

  return color[1]
}

function getForecast() {
  return new Promise((resolve, reject) => {

    forecast.get(position, (err, weather) =>{
      if (err) return reject(err)
      return resolve(weather)
    })
  })
}

function displayForecast(weather) {
  var nextXHours = weather.hourly.data.slice(0, strip.stripLength())
  nextXHours.map((c, idx) => {
    strip.pixel(idx).color(getColor(c.temperature))
  })
  strip.show()
}

function handleError(err) {
  console.log(err)
}

board.on("ready", function() {
  strip = new pixel.Strip({
    board: this,
    controller: "FIRMATA",
    strips: [ {pin: 6, length: 8} ]
  })


  strip.on("ready", function() {
    new CronJob({
      cronTime: '*/15 * * * *',
      onTick: () => {
        console.log('Fetching Weather')
        strip.color('black')
        strip.show()
        getForecast().then(displayForecast).catch(handleError)
      },
      start: true,
      runOnInit: true
    })
  })
})
