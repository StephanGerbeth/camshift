import SimplePeer from 'simple-peer';
import { fromEvent } from 'rxjs';
import { take, map, find } from 'rxjs/operators';

export default class WebRTC {
  constructor(stream, key = null) {
    this.key = key;
    this.peer = new SimplePeer({
      initiator: !key,
      trickle: false,
      stream: stream
    });
    this.database = loadDatabase();

    this.peer.on('error', err => console.log('error', err));

    this.getObserver('data').subscribe((data) => {
      console.log('data: ' + data);
    });
  }

  async setup () {
    const database = await this.database;
    const data = await this.listenTo('signal');
    // add answer to firebase
    const entry = await commitSignal(database, this.key, data);

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
    return this.listenTo('connect');
  }

  async destroy () {
    this.peer.destroy();
    const database = await this.database;
    database.destroy();
  }

  onStreamChange () {
    return this.listenTo('stream');
  }

  onClose () {
    return this.listenTo('close');
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

  getObserver (type) {
    return fromEvent(this.peer, type);
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

function commitSignal (database, key, data) {
  if (!key) {
    return database.add(data);
  } else {
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
