const {
  S3Client,
  SharedIniFileCredentials,
  ListObjectsCommand,
} = require("@aws-sdk/client-s3");

const { fromIni } = require("@aws-sdk/credential-providers");

const credentials = fromIni();

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: credentials,
});

s3Client
  .send(new ListObjectsCommand({ Bucket: "developer-task" }))
  .then((data) => {
    console.log("sukces");
    console.log("dane:", data);
  })
  .catch((err) => {
    console.error("bład", err);
  });
