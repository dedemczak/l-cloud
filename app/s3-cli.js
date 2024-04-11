const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

require("dotenv").config();

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const Bucket = "developer-task";
const Prefix = "x-wing/";

const listFiles = async () => {
  const params = {
    Bucket,
    Prefix,
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

const main = async () => {
  const command = new PutObjectCommand({
    Bucket,
    Key: Prefix + "hello-s3.txt",
    Body: "Hello S3!",
  });

  try {
    const response = await s3Client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

main();
