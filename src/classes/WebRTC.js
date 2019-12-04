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
      // stream: stream,
      config: {
        iceServers: [
          {
            urls: [
              'stun:eu-turn5.xirsys.com'
            ]
          }, {
            username: 'JwbjGz4loHRDEy7NOWAxuoG6OR_U5cO3LS4IshymjZIm5d1d9asAx7BVMevDBLOgAAAAAF3lGnlzZ2VyYmV0aA==',
            credential: 'fb820e16-150c-11ea-ba48-8e4d62b186e1',
            urls: [
              'turn:eu-turn5.xirsys.com:80?transport=udp',
              'turn:eu-turn5.xirsys.com:3478?transport=udp',
              'turn:eu-turn5.xirsys.com:80?transport=tcp',
              'turn:eu-turn5.xirsys.com:3478?transport=tcp',
              'turns:eu-turn5.xirsys.com:443?transport=tcp',
              'turns:eu-turn5.xirsys.com:5349?transport=tcp'
            ]
          }
        ]
      }
    });
    // this.peer.addStream(stream);
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
    return this.listenTo('connect');
  }

  async destroy () {
    this.peer.destroy();
    const database = await this.database;
    database.destroy();
  }

  addStream (stream) {
    console.log('OLO');
    this.peer.addStream(stream);
  }

  onStream () {
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
  console.log(value);
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
