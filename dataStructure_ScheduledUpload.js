import { MongoClient } from "mongodb";
import { createClient } from "redis";

const mongoClient = await MongoClient.connect("mongodb://localhost:27017");
const photos = mongoClient.db("photoStock").collection("photos");

const redisClient = createClient();
redisClient.on("error", function (error) {
  console.error(error);
});
await redisClient.connect();

// 2. Scheduled Uploads (Sorted Set):
// 	- Key: "scheduledUploads"
// 	- Members: photo IDs
// 	- Scores: Unix timestamps representing the scheduled upload time
// 	- Description: This sorted set can be used to manage the scheduling of photo uploads.
// 	  The photos from the Redis database are chosen to be uploaded with a user-set time. 
//    The users can also choose to immediately upload all the photos by setting the time to 0 second. 

async function addToScheduledUploads(photoId, scheduledTime) {
  await redisClient.zAdd("scheduled uploads", [
    {
      score: scheduledTime,
      value: photoId.toString(),
    },
  ]);
}

async function getPhotosForPosting() {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const photoIds = await redisClient.zRangeByScore(
    "scheduled uploads",
    0,
    currentTimestamp
  );
  return photoIds;
}

async function removeFromScheduledUploads(photoIds) {
  if (photoIds.length > 0) {
    await redisClient.zRem("scheduled uploads", photoIds);
  }
}

async function schedulePhotoUpload(photoId, scheduledTime) {
  await addToScheduledUploads(photoId, scheduledTime);
  console.log(`Photo ${photoId} scheduled for upload at ${scheduledTime}`);
}

async function processScheduledUploads() {
  const photoIds = await getPhotosForPosting();
  console.log(`Processing ${photoIds.length} scheduled photo uploads`);

  for (const photoId of photoIds) {
    console.log(`Posting photo ${photoId}`); //The photos are then posted if the API is provided. 
  }

  await removeFromScheduledUploads(photoIds);
}

//As an example, I reused my recentUpload structure to insert sample photos into the Redis database, 
//Then use this scheduledUpload structure to upload them immediately (for testing purpose, the time could be set)
const artistIds = await redisClient.keys("artistId:*");
console.log('Number of artists:', artistIds.length);

for (const id of artistIds) {
  console.log('Getting recent uploads for:', id);
  await schedulePhotoUpload(id.replace("artistId:", ""), Math.floor(Date.now() / 1000));
  console.log(`Scheduled uploads for artist ${id}`);
}

await processScheduledUploads();


await redisClient.flushDb(); // Flush the Redis database after processing scheduled uploads

await mongoClient.close();
await redisClient.quit();
