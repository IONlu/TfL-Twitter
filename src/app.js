var twitter = require('ntwitter'),
    https   = require('https'),
    fs      = require('fs'),
    moment  = require('moment'),
    request = require('request'),
    config  = require('./config');

var twit = new twitter( config.twitter );

//var connection = mysql.createConnection( config.db );

function getDepartures(handle, tw_id) {

    request('https://api.tfl.lu/departures/200901011', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var APIdepartures = JSON.parse(body);
            var departures = '';

            for(var d = 0; d < config.amountOfDepartures; d++) {

                var dep = APIdepartures[d];
                var departureTime = moment.unix(dep.departure);
                var humanReadableTime = departureTime.diff(moment(), 'minutes');
                departures += ucfirst(dep.type) + ' ' + dep.line + ' in ' + humanReadableTime + '’';
                /*if (dep.delay != 0) {
                    departures += ' ' + (dep.delay / 60) + '’late';
                }*/
                departures += "\n" + dep.destination;
                if (d < config.amountOfDepartures - 1) {
                    departures += "\n";
                };

            }

            twit.updateStatus(
                '@' + handle + "\n" + departures,
                {in_reply_to_status_id: tw_id},
                function (err, data) {
                    console.log(data);
                }
            );

        }

    });

}

function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

twit.stream('statuses/filter', {
    track: config.track
}, function(stream) {

    console.log('connected to twitter\'s streaming API...');

    stream.on('data', function (data) {

        if (data.text.substr(0,4) != 'RT @') {

            var post = {
                tw_id       : data.id_str,
                screen_name : data.user.screen_name,
                created_at  : data.created_at,
                text        : data.text
            };

            getDepartures(post.screen_name, post.tw_id);

        }

    });

    stream.on('error', function(error, code) {
        console.log("My error: " + error + ": " + code);
    });

});
