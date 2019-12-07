import SimplePeer from 'simple-peer';
import { fromEvent } from 'rxjs';
import { take, map, find } from 'rxjs/operators';

export default class WebRTC {
  constructor(stream, initiator = false, config) {
    console.log('--- NEW WEBRTC CLIENT ---');
    this.peer = new SimplePeer({
      initiator: initiator,
      trickle: false,
      stream: stream,
      config: config
    });

    this.database = loadDatabase();

    this.connect = onConnect(this.listenTo('stream'), this.listenTo('connect'));
    this.disconnect = onDisconnect(this.listenTo('close'), this.listenTo('error'));
    this.signal = this.listenTo('signal');

    this.getDataObserver().subscribe((data) => {
      console.log('data: ' + data);
    });
  }

  async publishSignal (key) {
    console.log('-> webrtc: publish signal', key);
    const database = await this.database;
    const data = await this.signal;

    if (!key) {
      data.type = 'offer';
      return database.add(data);
    } else {
      data.type = 'answer';
      return database.update(key, data);
    }
  }

  async receiveSignal (key) {
    console.log('-> webrtc: receive signal', key);
    const database = await this.database;
    return database.get(key);
  }

  async destroy () {
    console.log('-> webrtc: destroy');
    this.peer.destroy();
    const database = await this.database;
    database.destroy();
  }

  connectSlave (entry) {
    console.log('-> webrtc: connect slave');
    connectPeer(this.peer, entry, 'answer');
  }

  connectMaster (entry) {
    console.log('-> webrtc: connect master');
    connectPeer(this.peer, entry, 'offer');
  }

  send (data) {
    this.peer.send(data);
  }

  listenTo (type) {
    return fromEvent(this.peer, type)
      .pipe(
        take(1)
      )
      .toPromise();
  }

  getDataObserver () {
    return fromEvent(this.peer, 'data');
  }
}

async function onConnect (...listener) {
  const [
    stream
  ] = await Promise.all(listener);
  return stream;
}

async function onDisconnect (...listener) {
  return Promise.race(listener);
}

async function connectPeer (peer, entry, type) {
  console.log('-> webrtc: connect peer');
  const value = await fromEvent(entry, 'value')
    .pipe(
      map((snapshot) => snapshot.val()),
      find((val) => val.type === type),
      take(1)
    )
    .toPromise();
  peer.signal(value);
}

async function loadDatabase () {
  const { default: Database } = await import('@/service/firebase/database');
  return new Database('handshake');
}
