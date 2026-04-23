import { MongoClient } from 'mongodb';
import dns from 'node:dns';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

const dnsServers = (process.env.MONGODB_DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

try {
  dns.setServers(dnsServers);
} catch (error) {
  console.error('MongoDB: Gagal set DNS servers:', error);
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, options);

const clientPromise =
  global._mongoClientPromise ??
  (global._mongoClientPromise = client.connect().then((connectedClient) => {
    console.log('MongoDB: Berhasil terhubung ke Atlas');
    return connectedClient;
  }));

clientPromise.catch((err) => {
  console.error('MongoDB: Gagal terhubung ke Atlas:', err.message);
});

export default clientPromise;
