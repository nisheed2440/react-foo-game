import React, { Component, createRef, Fragment } from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import Modal from 'react-modal';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logo from './logo.png';
import config from './config';
const vCard = require('vcf');
Modal.setAppElement('#root');

class App extends Component {
  constructor(props) {
    super(props);
    this.videoRef = new createRef();
    firebase.initializeApp(config);
    this.db = firebase.firestore();
    this.db.settings({ timestampsInSnapshots: true });
    this.state = {
      showError: false,
      errorMsg: '',
      showSuccess: false,
      successMsg: '',
      modalIsOpen: false
    };
  }

  componentDidMount() {
    // Initialize the scanner
    let scanner = new window.Instascan.Scanner({
      video: this.videoRef.current
    });

    scanner.addListener('scan', content => {
      // Scanned content
      let parsedData = content;
      let isVCard = false;

      if (content.startsWith('BEGIN:VCARD')) {
        isVCard = true;
        parsedData = new vCard().parse(content).data;
        Object.keys(parsedData).forEach(key => {
          parsedData[key] = parsedData[key]._data;
        });
        parsedData['raw'] = content;
      }

      console.log(parsedData);
      this.setState({
        modalIsOpen: true
      });
      this.db
        .collection('users')
        .add({ data: parsedData })
        .then(docRef => {
          // Successful
          console.log('Document written with ID: ', docRef.id);
          this.setState({
            showError: false,
            errorMsg: '',
            showSuccess: true,
            successMsg: 'Connected to Quiz Portal!',
            modalIsOpen: true
          });
          // Update this to window.location.href
          window.location.href = `https://docs.google.com/forms/d/e/1FAIpQLScTrv_HFyhoCPL4QEJgjeYXjgtDngxSwSypJ0jv_8w9gZSFcg/viewform?usp=pp_url&entry.1482898844=${
            isVCard ? parsedData.fn : ''
          }&entry.603592442=${isVCard ? parsedData.email : ''}&entry.77762339=${
            isVCard ? parsedData.tel : ''
          }&entry.650067583=${isVCard ? parsedData.org : ''}`;
        })
        .catch(error => {
          // Failed
          console.error('Error adding document: ', error);
          this.setState({
            showError: true,
            errorMsg: 'Error adding document',
            showSuccess: false,
            successMsg: '',
            modalIsOpen: true
          });
        });
    });

    window.Instascan.Camera.getCameras()
      .then(function(cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);
        } else {
          // Scanner Error
          console.error('No cameras found.');
          this.setState({
            showError: true,
            errorMsg: 'No cameras found.',
            showSuccess: false,
            successMsg: '',
            modalIsOpen: true
          });
        }
      })
      .catch(function(e) {
        // Scanner Error
        console.error(e);
        this.setState({
          showError: true,
          errorMsg: e.toString()
        });
      });
  }
  dismissModal = () => {
    this.setState({
      errorMsg: '',
      showError: false,
      successMsg: '',
      showSuccess: false,
      modalIsOpen: false
    });
  };
  render() {
    return (
      <Fragment>
        <header className="masthead mb-auto">
          <div className="inner">
            <h3 className="masthead-brand text-center">Scan your QR</h3>
            <p>
              Hold up your id card against the camera to scan and enter the
              game.
            </p>
          </div>
        </header>

        <main role="main" className="inner cover">
          <video ref={this.videoRef} />
        </main>

        <footer className="mastfoot mt-auto">
          <div className="inner">
            <p>
              <img src={logo} alt="P.S Logo" style={{ height: 30 }} />
            </p>
          </div>
        </footer>

        <Modal
          isOpen={this.state.modalIsOpen}
          style={{
            content: {
              padding: 30,
              maxHeight: 300,
              maxWidth: 300,
              margin: 'auto',
              color: '#333'
            }
          }}
        >
          {/* Success Wrapper */}
          <div
            className="alert alert-success"
            role="alert"
            style={{ display: this.state.showSuccess ? 'block' : 'none' }}
          >
            {this.state.successMsg}
          </div>

          {/* Error Wrapper */}
          <div
            className="alert alert-danger"
            role="alert"
            style={{ display: this.state.showError ? 'block' : 'none' }}
          >
            {this.state.errorMsg}
          </div>
          {!this.state.showError ? (
            <div className="progress" style={{ margin: '40px 0' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            ''
          )}
          {!this.state.showSuccess && !this.state.showError ? (
            <p>Saving Data...</p>
          ) : (
            ''
          )}

          {this.state.showSuccess ? <p>Redirecting...</p> : ''}
        </Modal>
      </Fragment>
    );
  }
}

export default App;
