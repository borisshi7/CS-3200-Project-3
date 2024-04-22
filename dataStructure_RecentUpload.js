import { MongoClient } from "mongodb";
import { createClient } from "redis";

const mongoClient = await MongoClient.connect("mongodb://localhost:27017");
const photos = mongoClient.db("photoStock").collection("photos");

const redisClient = createClient();
redisClient.on("error", function (error) {
  console.error(error);
});
await redisClient.connect();

/*
  1. Photographer's Uploads (List):
  - Key: "recentUploads:artist_Id"
  - Elements: photo IDs of selected and uploaded photos by a photographer
  - Description: This DB is used to upload the contents to the database, for the photographer to select and upload the photos.
    The photos could be restricted to a certain number, in this example, 10 photos for batch uploading at one time. 
*/

async function addRecentUpload(artist_id, photo_id) {
  const key = `artistId:${artist_id}`;
  await redisClient.lPush(key, photo_id.toString());
  await redisClient.lTrim(key, 0, 9); //The number of photos stored are restricted to 10. 
}

async function getRecentUploads(artist_id) {
  const key = `artistId:${artist_id}`;
  const photoIds = await redisClient.lRange(key, 0, -1);
  const recentPhotos = await photos.find({ photo_id: { $in: photoIds.map(Number) } }).toArray();
  return recentPhotos;
}

// As an example, I searched for the photos about street photography and added them to the recent uploads list.
const newPhotos = await photos.find({
  "tags.tagName": "Street Photography"
}).toArray();
console.log('Number of new photos:', newPhotos.length);

for (const newPhoto of newPhotos) {
  console.log('New Photo:', newPhoto);
  await addRecentUpload(newPhoto.artist.artist_id, newPhoto.photo_id);
}

if (newPhotos.length > 0) {
  const recentUploads = await getRecentUploads(newPhotos[0].artist.artist_id);
  console.log('Recent Uploads:', recentUploads);
} else {
  console.log('No new photos found that match the criteria.');
}

//redisClient.FLUSHDB();

await mongoClient.close();
await redisClient.quit();