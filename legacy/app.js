const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');

const token =
  'BQBJ8dfnhGAU34uuE5P8CjecSsdJDG7kJ8HPofr1sttffG8htlO4hYwGeVNfRXJp8gCjfmHCbldyEoScSX_XbqJo4kdXTOmt0DYo4zUHS8r15xt84KyQBt0bE8fVW24znBamkWizQS7geBnQ_MNj2UZjVHSoQdcZ6ErCyJxl4BcEIOCwCUtoB3Jc8aDdZiK5OrZcpaskitUr_g';

// let date = '';
const date = '2015-09-20';
// const setDate = inputDate => {
//   date = inputDate;
//   console.log(date);
// };
let songArr = [];
let artistArr = [];
let playlistName = '';
let playlistId = '';
const url = `https://www.billboard.com/charts/hot-100/${date}`;
const app = {};

axios.get(url).then(res => {
  const $ = cheerio.load(res.data);

  const week = $('.chart-detail-header__date-selector-button');
  const weekName = week.text();
  playlistName = `Top Charts From: ${weekName}`;

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
});

let jsonData = {
  name: `On this date: ${date}`,
  public: false,
  description: `On this date: ${date}`,
};

axios({
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
    console.log(response);
  },
})
  .then(res => {
    playlistId = res.data.id;
    console.log(playlistId);
  })
  .then(() => {
    for (let i = 0; i < 40; i++) {
      const song = songArr[i];
      const artist = artistArr[i];

      axios({
        method: 'GET',
        url: `https://api.spotify.com/v1/search?q=track:${song}%20artist:${artist}&type=track`,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        success: function(response) {
          console.log(response);
        },
      }).then(response => {
        const songId = response.data.tracks.items[0].id;
        app.postSong(songId);
      });
    }
  });

app.postSong = id =>
  axios({
    method: 'POST',
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?position=0&uris=spotify%3Atrack%3A${id}`,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  });

// request(
//   `https://www.billboard.com/charts/hot-100/${date}`,
//   (err, res, html) => {
//     if (!err && res.statusCode === 200) {
//       const $ = cheerio.load(html);

//       const week = $('.chart-detail-header__date-selector-button');
//       const weekName = week.text();
//       playlistName = `Top Charts From: ${weekName}`;

//       const numberOneTitle = $('.chart-number-one__title');
//       const numberOneArtist = $('.chart-number-one__artist');

//       // console.log(numberOneArtist.text());
//       const oneTitle = numberOneTitle.text();
//       const oneArtist = numberOneArtist.text();

//       // const chartDetails = $('.chart-details');
//       // console.log(chartDetails.html());
//       // const output = chartDetails.find('.chart-list-item');

//       // const title = chartDetails.find('.chart-list-item__title');
//       // const artist = chartDetails.find('.chart-list-item__artist');

//       // console.log(title.text());
//       // console.log(artist.text());
//       songArr = [oneTitle];
//       artistArr = [oneArtist];

//       $('.chart-list-item__title').each((i, titleLoop) => {
//         const item = $(titleLoop).text();
//         let editedItem = item.slice(2, item.length - 2);
//         if (editedItem[0] === ' ') {
//           editedItem = editedItem.slice(1);
//         }
//         songArr.push(editedItem);
//       });
//       console.log('inside', songArr);

//       $('.chart-list-item__artist').each((i, artistLoop) => {
//         let item = $(artistLoop)
//           .text()
//           .replace(/\n\n/, '')
//           .replace(/\n/, '');
//         item = item.slice(0, item.length - 1);

//         // let editedItem = item.slice(2, item.length - 2);
//         // if (editedItem[0] === ' ') {
//         //   editedItem = editedItem.slice(1);
//         // }
//         // item.replace('/n', '');

//         artistArr.push(item);
//         // console.log(item);
//       });
//       console.log('inside', artistArr);
//     }

//     let jsonData = {
//       name: `On this date: ${date}`,
//       public: false,
//       description: `On this date: ${date}`,
//     };

//     let playlistId = '';

//     axios({
//       url: `https://api.spotify.com/v1/users/kaitlinmaier/playlists`,
//       method: 'POST',
//       data: jsonData,
//       dataType: 'json',
//       // data: {
//       //   name: JSON({ name: 'test', public: false }),
//       // },
//       headers: {
//         Authorization: 'Bearer ' + token,
//         'Content-Type': 'application/json',
//       },
//       success: function(response) {
//         console.log(response);
//       },
//     })
//       .then(res => {
//         playlistId = res.data.id;
//         console.log(playlistId);
//       })
//       .then(() => {
//         for (let i = 0; i < 10; i++) {
//           const song = songArr[i];
//           const artist = artistArr[i];

//           axios({
//             method: 'GET',
//             url: `https://api.spotify.com/v1/search?q=track:${song}%20artist:${artist}&type=track`,
//             headers: {
//               Authorization: 'Bearer ' + token,
//               'Content-Type': 'application/json',
//             },
//             success: function(response) {
//               console.log(response);
//             },
//           }).then(response => {
//             const songId = response.data.tracks.items[0].id;
//             postSong(songId);
//           });

//           const postSong = songId =>
//             axios({
//               method: 'POST',
//               url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?position=0&uris=spotify%3Atrack%3A${songId}`,
//               headers: {
//                 Authorization: 'Bearer ' + token,
//                 'Content-Type': 'application/json',
//               },
//             });
//         }
//       });
//   }
// );

// console.log('outside', songArr);
// console.log('outside', artistArr);
// let app = {};

// let jsonData = {
//   name: `On this day2: ${date}`,
//   public: false,
//   description: `On this day: ${date}`,
// };

// axios({
//   url: `https://api.spotify.com/v1/users/kaitlinmaier/playlists`,
//   method: 'POST',
//   data: jsonData,
//   dataType: 'json',
//   // data: {
//   //   name: JSON({ name: 'test', public: false }),
//   // },
//   headers: {
//     Authorization:
//       'Bearer ' +
//       'BQB7nt7SienTyea0lg-jcG-k8fW2gFj_KKZu7ECeXcKENXduGEiYctRlnu_3PQxsQsBCqXsS9rfHhmCPwq3KKvjSEJVi7X5BxXz2Dg4J4Pdhoz4swwOgtu4waSCvP99Fw9pUCdSYSC_AfHNo5f9_EksP5mxFGd8IYsD9XF5tYDmpchpNrjeBtnSry7psbr9RtbY0KumsPAUokw',
//     'Content-Type': 'application/json',
//   },
//   success: function(response) {
//     console.log(response);
//   },
// }).then(res => {
//   const id = res.data;
//   console.log(id);
// });

// axios({
//   method: 'GET',
//   url: `https://api.spotify.com/v1/search?q=track:Kiss%20artist:Prince&type=track`,
//   headers: {
//     Authorization:
//       'Bearer ' +
//       'BQB7nt7SienTyea0lg-jcG-k8fW2gFj_KKZu7ECeXcKENXduGEiYctRlnu_3PQxsQsBCqXsS9rfHhmCPwq3KKvjSEJVi7X5BxXz2Dg4J4Pdhoz4swwOgtu4waSCvP99Fw9pUCdSYSC_AfHNo5f9_EksP5mxFGd8IYsD9XF5tYDmpchpNrjeBtnSry7psbr9RtbY0KumsPAUokw',
//     'Content-Type': 'application/json',
//   },
//   success: function(response) {
//     console.log(response);
//   },
// });

// let testArr = ['Hello'];

// const song = testArr[0];

// axios({
//   method: 'GET',
//   url: `https://api.spotify.com/v1/search?q=track:${song}%20artist:Prince&type=track`,
//   headers: {
//     Authorization:
//       'Bearer ' +
//       'BQB7nt7SienTyea0lg-jcG-k8fW2gFj_KKZu7ECeXcKENXduGEiYctRlnu_3PQxsQsBCqXsS9rfHhmCPwq3KKvjSEJVi7X5BxXz2Dg4J4Pdhoz4swwOgtu4waSCvP99Fw9pUCdSYSC_AfHNo5f9_EksP5mxFGd8IYsD9XF5tYDmpchpNrjeBtnSry7psbr9RtbY0KumsPAUokw',
//     'Content-Type': 'application/json',
//   },
//   success: function(response) {
//     console.log(response);
//   },
// }).then(res => {
//   const id = res.data.tracks.items[0].id;
//   console.log(id);
//   app.postSong(id);
// });

// app.postSong = id =>
//   axios({
//     method: 'POST',
//     url: `https://api.spotify.com/v1/playlists/6eng92M8epqfQzWwcVapKL/tracks?position=0&uris=spotify%3Atrack%3A${id}`,
//     headers: {
//       Authorization:
//         'Bearer ' +
//         'BQB7nt7SienTyea0lg-jcG-k8fW2gFj_KKZu7ECeXcKENXduGEiYctRlnu_3PQxsQsBCqXsS9rfHhmCPwq3KKvjSEJVi7X5BxXz2Dg4J4Pdhoz4swwOgtu4waSCvP99Fw9pUCdSYSC_AfHNo5f9_EksP5mxFGd8IYsD9XF5tYDmpchpNrjeBtnSry7psbr9RtbY0KumsPAUokw',
//       'Content-Type': 'application/json',
//     },
//   });

// axios({
//   url: 'https://api.spotify.com/v1/search',
//   method: 'GET',
//   dataType: 'json',
//   data: {
//     type: 'track,artist',
//     q: '',
//   },
// });
