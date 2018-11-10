const express = require('express');
const path = require('path');
const morgan = require('morgan');
const passport = require('passport');
const app = express();
const PORT = 1337;
const request = require('request'); // "Request" library
let querystring = require('querystring');
process.env.SPOTIFY_CLIENT_ID = '9873bd8ace5b46d680506db5a4a58e1c';
process.env.SPOTIFY_CLIENT_SECRET = 'd9183ca7cc9640c7bc58b18fbf51d4ce';
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
        new Buffer(
          process.env.SPOTIFY_CLIENT_ID +
            ':' +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
    },
    json: true,
  };
  request.post(authOptions, function(error, response, body) {
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
  console.log('scrape');
  const date = req.params.date;
  console.log('server', date);
  scrape(date);
});

app.get('/', (req, res, next) => {
  console.log('hello');
  res.redirect('/login');
  // res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  const server = app.listen(PORT, () => console.log(`listening on ${PORT}`));
};

startListening();

const cheerio = require('cheerio');
const axios = require('axios');
// const date = '2017-09-13';
// const url = `https://www.billboard.com/charts/hot-100/${date}`;
let songArr = [];
let artistArr = [];
// const token =
//   'BQDpsU7T9IRv53w2a5oh2z2f_fXIYGsFHxMZ2N8C9ARHOJgskLqXEGnwo-T-0uoH9Pqk-caXnFm0dlAHUKM-Yz--IdgcHPAeI90L_OpRHqCDLtEgHQ-cyz66B_gsyIDoSgp_eIO1LGaKGGBs7L-rmlCTCdJnQo7EGXeg4nEHkDrqwVUJotunpzJcikBf6KI8Ua4eMrdVvj3Clg';
let playlistId = '';

const scrape = async date => {
  try {
    // const date = '2017-09-13';
    const url = `https://www.billboard.com/charts/hot-100/${date}`;
    const res = await axios.get(url);
    const $ = await cheerio.load(res.data);

    const week = $('.chart-detail-header__date-selector-button');
    const weekName = week.text();
    // playlistName = `Top Charts From: ${weekName}`;

    const numberOneTitle = $('.chart-number-one__title');
    const numberOneArtist = $('.chart-number-one__artist');

    // console.log(numberOneArtist.text());
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
      item = item.slice(0, item.length - 1);

      artistArr.push(item);
    });
    console.log('inside', artistArr);
    // await postPlaylist(date);
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
    console.error(err);
  }
};

const postPlaylist = async (date, id) => {
  try {
    let jsonData = {
      name: `On this date: ${date}`,
      public: false,
      description: `On this date: ${date}`,
    };
    const res = await axios({
      url: `https://api.spotify.com/v1/users/${id}/playlists`,
      method: 'POST',
      data: jsonData,
      dataType: 'json',
      // data: {
      //   name: JSON({ name: 'test', public: false }),
      // },
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
    console.error(err);
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
      // console.log('res.dat', res.data.items);
      if (res.data.tracks.items.length) {
        const songId = res.data.tracks.items[0].id;
        if (songId) {
          postSong(songId);
        }
      }
    }
  } catch (err) {
    console.error(err);
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
    console.error(err);
  }
};
