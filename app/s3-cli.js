require("dotenv").config();
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = "developer-task";
const objectPrefix = "x-wing/";

const listFiles = async () => {
  const params = {
    Bucket: bucketName,
    Prefix: objectPrefix,
  };

  try {
    const data = await s3Client.send(new ListObjectsCommand(params));
    data.Contents.forEach((obj) => {
      console.log(obj.Key);
    });
  } catch (err) {
    console.error("Błąd podczas listowania plików:", err);
  }
};

listFiles();
