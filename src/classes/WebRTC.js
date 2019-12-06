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

    this.getDataObserver().subscribe((data) => {
      console.log('data: ' + data);
    });
  }

  async setup () {
    const database = await this.database;
    const data = await this.listenTo('signal');
    // add answer to firebase
    const entry = await publishSignal(database, this.key, data);

    if (!this.key) {
      // contact client
      connectPeer(this.peer, entry, 'answer');
      return entry.key;
    }
  }

  async connect () {
    if (this.key) {
      // get offer from firebase
      const database = await this.database;
      const entry = database.get(this.key);
      // contact master
      connectPeer(this.peer, entry, 'offer');
    }
    return Promise.all([
      this.listenTo('stream'), this.listenTo('connect')
    ]).then(([
      stream
    ]) => stream);
  }

  async destroy () {
    this.peer.destroy();
    const database = await this.database;
    database.destroy();
  }

  onStream () {
    return this.listenTo('stream');
  }

  onClose () {
    return this.listenTo('close');
  }

  onError () {
    return this.listenTo('error');
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

function loadDatabase () {
  return import('@/service/firebase/database')
    .then(({ default: database }) => database)
    .then((Database) => {
      return new Database('handshake');
    });
}

async function connectPeer (peer, entry, type) {
  const value = await waitForSignal(entry, type);
  peer.signal(value);
}

function publishSignal (database, key, data) {
  if (!key) {
    data.type = 'offer';
    return database.add(data);
  } else {
    data.type = 'answer';
    return database.update(key, data);
  }
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
