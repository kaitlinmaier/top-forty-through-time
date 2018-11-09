const express = require('express');
const path = require('path');
const morgan = require('morgan');
const app = express();
const PORT = 1337;

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/scrape/:date', (req, res, next) => {
  console.log('scrape');
  const date = req.params.date;
  console.log('server', date);
  scrape(date);
});

app.get('/*', (req, res, next) => {
  console.log('hello');
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
const token =
  'BQBBeRwRPokL48EPVrENUTHWXj6sgz5-7z_BHwEBIwlGtQn9Gc7eyzrwmNDL4IiT5lnLpHecOgvPnYzEmiF4dLiJraJlTU2Y1-lruerNPHQ6pqyiE7XIMxvoSPCk5iT3yhjJUmsesALNF39emXNxor6VlCJMUVox_JEIQbNVaodovLeyN3_PSm2RFxI4lODdNxmnyi6EcWQKsg';
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
    await postPlaylist(date);
  } catch (err) {
    console.error(err);
  }
};

const postPlaylist = async date => {
  try {
    let jsonData = {
      name: `On this date: ${date}`,
      public: false,
      description: `On this date: ${date}`,
    };
    const res = await axios({
      url: `https://api.spotify.com/v1/users/kaitlinmaier/playlists`,
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
