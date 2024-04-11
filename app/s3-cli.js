const {
  S3Client,
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectCommand,
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

const listFilesParams = {
  Bucket,
  Prefix,
};
const listFiles = async (...options) => {
  try {
    let regexPattern = null;
    let showModifiedDate = false;
    let showSize = false;

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      switch (option) {
        case "-rgx":
          if (options[i + 1] && options[i + 1].startsWith("'")) {
            regexPattern = options[i + 1].slice(1, -1);
            i++; // przesuwamy index o 1 aby przejść do nastepnych argumentów
          } else {
            console.error("Nieprawidłowy format regexa.");
            return;
          }
          break;
        case "-m":
          showModifiedDate = true;
          break;
        case "-s":
          showSize = true;
          break;
        default:
          break;
      }
    }

    const data = await s3Client.send(new ListObjectsCommand(listFilesParams));
    data.Contents.forEach((obj) => {
      let fileName = obj.Key;
      let fileParts = fileName.split("/"); // tworzymy tablcię, gdy lista zawsze zawier "prefix"

      let regexMatch = true;
      if (regexPattern) {
        regexMatch = fileParts.some((part) =>
          new RegExp(regexPattern).test(part)
        );
      }

      if (regexMatch) {
        // decydujemy czy wyświetlamy jakieś iformacje
        console.log("Nazwa pliku:", fileName);

        if (showModifiedDate) {
          console.log("Data modyfikacji:", obj.LastModified.toISOString());
        }
        if (showSize) {
          console.log("Rozmiar pliku:", obj.Size);
        }
      }
    });
  } catch (err) {
    console.error("Błąd", err);
  }
};

listFiles("-n");

const deleteFilesByRegex = async (regexPattern) => {
  try {
    const data = await s3Client.send(new ListObjectsCommand(listFilesParams));
    data.Contents.forEach(async (obj) => {
      let fileName = obj.Key;
      console.log(fileName);
      let fileParts = fileName.split("/"); // znowu dzielimy na tablicę

      regexMatch = fileParts.some((part) =>
        new RegExp(regexPattern).test(part)
      );

      if (regexMatch) {
        const deleteParams = {
          Bucket,
          Prefix,
          Key: fileName,
        };
        try {
          const response = await s3Client.send(
            new DeleteObjectCommand(deleteParams)
          );
          console.log(`Usunięto plik: ${fileName}`);
        } catch (deleteErr) {
          console.error(`Błąd podczas usuwania pliku ${fileName}:`, deleteErr);
        }
      }
    });
  } catch (err) {
    console.error("Błąd", err);
  }
};

deleteFilesByRegex("^h.*\\.txt$");

const uploadFile = async (fileName, Body) => {
  const cmd = new PutObjectCommand({
    Bucket,
    Key: Prefix + fileName,
    Body,
  });

  try {
    const response = await s3Client.send(cmd);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};
