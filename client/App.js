import React, { Component } from 'react';
import axios from 'axios';

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
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
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

  render() {
    return (
      <div>
        <h1>Top 40 Through Time</h1>
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
        <button type="submit" onClick={this.handleClick}>
          Click
        </button>
      </div>
    );
  }
}

export default App;
