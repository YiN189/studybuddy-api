import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'studybuddy';

// Same pattern as hello-api-demo: options for MongoDB Atlas (cloud)
// TLS options only for mongodb+srv (Atlas); local mongodb:// doesn't use them
const isAtlas = uri.startsWith('mongodb+srv://');
const options = isAtlas
  ? {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }
  : {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export function getClientPromise() {
  return clientPromise;
}

export default clientPromise;
