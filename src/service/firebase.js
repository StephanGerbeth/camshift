import firebase from 'firebase/app';
import 'firebase/database';

class App {
  constructor() {
    this.app = null;
  }

  getApp () {
    if (!this.app) {
      this.app = firebase.initializeApp({
        apiKey: 'AIzaSyBQtIBNYuvlHRpgOOUZFCxASVaj4RtKR1A',
        authDomain: 'electroar-f501e.firebaseapp.com',
        databaseURL: 'https://electroar-f501e.firebaseio.com',
        projectId: 'electroar-f501e',
        storageBucket: 'electroar-f501e.appspot.com',
        messagingSenderId: '854608988353',
        appId: '1:854608988353:web:8c57fec189f8e3cbeaec40'
      });
    }
    return this.app;
  }

  getDatabase (name) {
    return firebase.database(this.getApp()).ref(name);
  }
}

export default new App();
