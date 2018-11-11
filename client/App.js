import React, { Component } from 'react';
import axios from 'axios';
import queryString from 'query-string';

const days = [];
for (let i = 1; i <= 31; i++) {
  if (i <= 9) {
    days.push(`0${i}`);
  } else {
    days.push(`${i}`);
  }
}

const years = [];
for (let i = 1960; i <= 2018; i++) {
  years.push(`${i}`);
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      month: '11',
      day: '30',
      year: '1992',
      accessToken: '',
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    // this.handleLogin = this.handleLogin.bind(this);
  }

  handleClick = () => {
    console.log('click');
    const date = `${this.state.year}-${this.state.month}-${this.state.day}`;
    console.log(date);
    axios.get(`/api/scrape/${date}`);
  };

  handleChange = event => {
    console.log(this.state);
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  componentDidMount = () => {
    // window.location = 'http://localhost:1337/login';
    // axios.get('/login');
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token;
    console.log(accessToken);
    this.setState({
      accessToken,
    });
  };

  render() {
    return (
      <div id="app">
        <h1>Top 40 Through Time</h1>
        <img src={`/Spotify_Logo_RGB_Green.png`} />
        {this.state.accessToken ? (
          <div>
            <div>
              <h3>
                Choose a date to create a playlist from Billboard's Hot 100
              </h3>
            </div>
            <div className="date">
              <label>Month</label>
              <select name="month" onChange={this.handleChange}>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <label>Day</label>
              <select name="day" onChange={this.handleChange}>
                {days.map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <label>Year</label>
              <select name="year" onChange={this.handleChange}>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="button">
              <button type="submit" onClick={this.handleClick}>
                Make Playlist
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => (window.location = 'http://localhost:1337/login')}
          >
            Sign In
          </button>
        )}
      </div>
    );
  }
}

export default App;
