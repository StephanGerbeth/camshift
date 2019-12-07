import SimplePeer from 'simple-peer';
import { fromEvent } from 'rxjs';
import { take, map, find } from 'rxjs/operators';

export default class WebRTC {
  constructor(stream, key = null, config) {
    console.log(config);
    this.key = key;
    this.peer = new SimplePeer({
      initiator: !key,
      trickle: false,
      stream: stream,
      config: config
    });

    this.database = loadDatabase();

    this.signal = this.listenTo('signal');
    this.connect = onConnect(this.listenTo('stream'), this.listenTo('connect'));
    this.disconnect = onDisconnect(this.listenTo('close'), this.listenTo('error'));

    this.getDataObserver().subscribe((data) => {
      console.log('data: ' + data);
    });
  }

  async publishSignal () {
    const database = await this.database;
    const data = await this.signal;

    if (!this.key) {
      data.type = 'offer';
      return database.add(data);
    } else {
      data.type = 'answer';
      return database.update(this.key, data);
    }
  }

  async receiveSignal (key) {
    const database = await this.database;
    return database.get(key);
  }

  async destroy () {
    this.peer.destroy();
    const database = await this.database;
    database.destroy();
  }

  connectSlave (entry) {
    connectPeer(this.peer, entry, 'answer');
  }

  connectMaster (entry) {
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
  const value = await waitForSignal(entry, type);
  peer.signal(value);
}

async function loadDatabase () {
  const { default: Database } = await import('@/service/firebase/database');
  return new Database('handshake');
}

function waitForSignal (entry, value) {
  return fromEvent(entry, 'value')
    .pipe(
      map((snapshot) => snapshot.val()),
      find((val) => val.type === value),
      take(1)
    )
    .toPromise();
}
