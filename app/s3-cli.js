const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");

// Konfiguracja poświadczeń dostępu
const credentials = {
  accessKeyId: "AKIAVKNBWT6MRTC5NMY2",
  secretAccessKey: "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",
};

// Tworzenie klienta S3
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "x-wing",
  credentials,
});

// Funkcja do listowania wszystkich plików w kubełku S3
async function listFiles() {
  const params = {
    Bucket: "developer-task",
  };

  try {
    const data = await s3Client.send(new ListObjectsCommand(params));
    console.log(
      "Pliki w kubełku:",
      data.Contents.map((obj) => obj.Key)
    );
  } catch (err) {
    console.error("Błąd podczas listowania plików:", err);
  }
}

// Wywołanie funkcji
listFiles();
