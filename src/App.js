import logo from './logo.svg';
import './App.css';
import React from 'react';

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <TTSInput></TTSInput>
      </header>
    </div>
  );
}

class TTSInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: "",
      audioURL: "",
      voices: [],
      selectedVoice: null
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getVoices = this.getVoices.bind(this);
    this.receiveAudio = this.receiveAudio.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
  }

  componentDidMount() {
    this.getVoices()
  }

  getVoices() {
    fetch("https://tts.tiro.is/v0/voices")
      .then(res => res.json())
      .then(res => this.setState({voices: res}))
  }

  handleChange(event) {
    this.setState({inputText: event.target.value});
  }

  handleSubmit(event) {
    this.sendRequest({text: this.state.inputText, VoiceId: this.state.selectedVoice})
    event.preventDefault();
  }

  receiveAudio(res) {
    console.log(res);
    // const stream = res.body;
    // const response = new Response(stream);
    // var res_blob = response.blob();
    var blob = new Blob([res.body], {type: 'audio/ogg'});
    var url = window.URL.createObjectURL(blob)
    console.log(url);
    this.setState({audioURL: url});
  }

  sendRequest(props) {
    const data = {Text: props.text, OutputFormat: 'ogg_vorbis', VoiceId: props.VoiceId}
    fetch("https://tts.tiro.is/v0/speech", {
      method: "POST",
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, 
      body: JSON.stringify(data) // body data type must match "Content-Type" 
    })
    .then(response => response.body)
    .then(body => {
      const reader = body.getReader();
    
      return new ReadableStream({
        start(controller) {
          return pump();
    
          function pump() {
            return reader.read().then(({ done, value }) => {
              // When no more data needs to be consumed, close the stream
              if (done) {
                controller.close();
                return;
              }
    
              // Enqueue the next data chunk into our target stream
              controller.enqueue(value);
              return pump();
            });
          }
        }
      })
    })
    .then(stream => new Response(stream))
    .then(response => response.blob())
    .then(blob => URL.createObjectURL(blob))
    .then(url => this.setState({audioURL: url}))
    .catch(err => console.error(err));
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '50vh',
          alignItems: 'center'
          }}>
        <label>
          Veldu rödd:
          <select value={this.state.selectedVoice} onChange={e => this.setState({selectedVoice: e.target.value})}>
            {
              this.state.voices.map(({ VoiceId }, index) => <option value={VoiceId} >{VoiceId}</option>  )
            }
          </select>
        </label>
        <label>
          Text:
          <textarea style={{width:'200px', height: '100px'}} placeholder={"Skrifaðu textann sem þú vilt að talgervillinn segi"} value={this.state.value} onChange={this.handleChange} />
        </label>
        <input style={{ padding:'15px' }} type="submit" value="Senda" />
        <audio controls src={this.state.audioURL}></audio>
      </form>
    );
  }
}


export default App;
