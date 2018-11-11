const express = require('express');
const path = require('path');
const morgan = require('morgan');
const passport = require('passport');
const app = express();
const PORT = 1337;
const request = require('request');
const axios = require('axios');
let querystring = require('querystring');
require('../secrets');
let token = '';

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

let redirect_uri = process.env.REDIRECT_URI || 'http://localhost:1337/callback';

app.get('/login', function(req, res) {
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope:
          'playlist-modify-private user-read-private user-read-email user-read-birthdate',
        redirect_uri,
      })
  );
});

app.get('/callback', function(req, res) {
  let code = req.query.code || null;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        new Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ':' +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
    },
    json: true,
  };

  // axios.post(authOptions, (error, response, body) => {
  //   if (!error) {
  //     let access_token = body.access_token;
  //     let refresh_token = body.refresh_token;
  //     console.log(body);
  //     console.log('refresh', refresh_token);
  //     token = access_token;
  //     console.log('token', token);
  //     let uri = process.env.FRONTEND_URI || 'http://localhost:1337';
  //     res.redirect(uri + '?access_token=' + access_token);
  //   }
  // });

  request.post(authOptions, function(error, response, body) {
    if (!error)
      try {
        let access_token = body.access_token;
        let refresh_token = body.refresh_token;
        console.log(body);
        console.log('refresh', refresh_token);
        token = access_token;
        console.log('token', token);
        let uri = process.env.FRONTEND_URI || 'http://localhost:1337';
        res.redirect(uri + '?access_token=' + access_token);
      } catch (error) {
        next(error);
      }
    // res.redirect(uri);
  });
});

app.get('/api/scrape/:date', (req, res, next) => {
  const date = req.params.date;
  scrape(date);
});

app.get('/', (req, res, next) => {
  // res.redirect('/login');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  const server = app.listen(PORT, () => console.log(`listening on ${PORT}`));
};

startListening();

const cheerio = require('cheerio');
let songArr = [];
let artistArr = [];
let playlistId = '';

const scrape = async date => {
  try {
    const url = `https://www.billboard.com/charts/hot-100/${date}`;
    const res = await axios.get(url);
    const $ = await cheerio.load(res.data);

    const week = $('.chart-detail-header__date-selector-button');

    const numberOneTitle = $('.chart-number-one__title');
    const numberOneArtist = $('.chart-number-one__artist');

    const oneTitle = numberOneTitle.text();
    const oneArtist = numberOneArtist.text();

    songArr = [oneTitle];
    artistArr = [oneArtist];

    $('.chart-list-item__title').each((i, titleLoop) => {
      const item = $(titleLoop).text();
      let editedItem = item.slice(2, item.length - 2);
      if (editedItem[0] === ' ') {
        editedItem = editedItem.slice(1);
      }
      songArr.push(editedItem);
    });
    console.log('inside', songArr);

    $('.chart-list-item__artist').each((i, artistLoop) => {
      let item = $(artistLoop)
        .text()
        .replace(/\n\n/, '')
        .replace(/\n/, '');
      artistArr.push(item);
    });
    console.log('inside', artistArr);
    await getId(date);
  } catch (err) {
    console.error(err);
  }
};

const getId = async date => {
  try {
    const res = await axios({
      url: 'https://api.spotify.com/v1/me',
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      success: function(response) {
        // console.log(response);
      },
    });
    const id = res.data.id;
    console.log(id);
    await postPlaylist(date, id);
  } catch (err) {
    // console.error(err);
  }
};

const postPlaylist = async (date, id) => {
  try {
    let jsonData = {
      name: `Billboard Hot 100 on ${date.slice(5, 7)}/${date.slice(
        8
      )}/${date.slice(0, 4)}`,
      public: false,
      description: `Billboard Hot 100 on ${date.slice(5, 7)}/${date.slice(
        8
      )}/${date.slice(0, 4)}`,
    };
    const res = await axios({
      url: `https://api.spotify.com/v1/users/${id}/playlists`,
      method: 'POST',
      data: jsonData,
      dataType: 'json',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      success: function(response) {
        // console.log(response);
      },
    });
    playlistId = res.data.id;
    getSongs();
  } catch (err) {
    // console.error(err);
  }
};

const getSongs = async () => {
  try {
    for (let i = 100; i >= 0; i--) {
      const song = songArr[i];
      const artist = artistArr[i];
      console.log('getSong', song);
      const res = await axios({
        method: 'GET',
        url: `https://api.spotify.com/v1/search?q=track:${song}%20artist:${artist}&type=track`,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });
      if (res.data.tracks.items.length) {
        const songId = res.data.tracks.items[0].id;
        if (songId) {
          postSong(songId);
        }
      }
    }
  } catch (err) {
    // console.error(err);
  }
};

const postSong = async songId => {
  try {
    await axios({
      method: 'POST',
      url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?position=0&uris=spotify%3Atrack%3A${songId}`,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    // console.error(err);
  }
};
