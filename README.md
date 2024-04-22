The data structures I’m going to implement are a scheduled uploading database for the photographers. The descriptions are the following: 
1. Photographer's Uploads (List):
	- Key: "artist id:artist_Id"
	- Elements: id of selected and uploaded photos by a photographer
	- Description: This DB is used to upload the contents to the database, for the photographer to select and upload the photos.

	The photos could be restricted to a certain number, in this example, 10 photos for batch uploading at one time.


2. Scheduled Uploads (Sorted Set):
	- Key: "scheduledUploads"
	- Members: photo IDs (id)
	- Scores: Unix timestamps representing the scheduled upload time
	- Description: This sorted set can be used to manage the scheduling of photo uploads.

	The photos from the Redis database are chosen to be uploaded with a user-set time. The users can also choose to immediately upload all the photos by setting the time to 0 second. 
