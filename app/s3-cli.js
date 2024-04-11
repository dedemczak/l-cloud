const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });
const readlineSync = require("readline-sync");
const { Command } = require("commander");
const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const program = new Command();

const s3Client = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
  },
});
const Bucket = "developer-task";
const Prefix = "x-wing/";

const listFilesParams = {
  Bucket,
  Prefix,
};

const uploadFile = async (filePath, options) => {
  try {
    const { overwrite } = options;
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    if (!overwrite) {
      // Sprawdź, czy plik już istnieje w Buckecie
      const existsParams = {
        Bucket,
        Key: `${Prefix}${fileName}`,
      };
      const fileExists = await s3Client
        .send(new HeadObjectCommand(existsParams))
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Jeśli plik już istnieje i nie została użyta flaga --overwrite, zapytaj użytkownika, czy chce go zastąpić
        const answer = readlineSync.question(
          "Plik już istnieje w Bucket. Czy chcesz go zastąpić? (t/n)"
        );
        if (answer.toLowerCase() !== "t" && answer.toLowerCase() !== "tak") {
          console.log("Operacja została anulowana. Plik nie został przesłany.");
          return;
        }
      }
    }

    const params = {
      Bucket,
      Key: `${Prefix}${fileName}`,
      Body: fileContent,
    };

    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("Plik został przesłany do Bucketu.", data);
  } catch (err) {
    console.error("Błąd podczas przesyłania pliku do Bucketu:", err);
  }
};

// uploadFile("test.txt");
const deleteFilesByRegex = async (options) => {
  let regexPattern = null;
  let fileName = null;

  options.forEach((option, index) => {
    switch (option) {
      case "-rgx":
        if (options[index + 1]) {
          regexPattern = options[index + 1];
        } else {
          console.error("Nieprawidłowy format regexa");
        }
        break;
      default:
        fileName = option;
        break;
    }
  });

  console.log(regexPattern);

  try {
    const data = await s3Client.send(new ListObjectsCommand(listFilesParams));
    if (!data || !data.Contents || data.Contents.length === 0) {
      console.log("Brak plików do usunięcia.");
      return;
    }

    for (const obj of data.Contents) {
      const fileKey = obj.Key;
      const fileParts = fileKey.split("/");
      if (
        (regexPattern && new RegExp(regexPattern).test(fileKey)) ||
        (fileName && fileParts[fileParts.length - 1] === fileName)
      ) {
        const deleteParams = {
          Bucket,
          Key: fileKey,
        };
        try {
          const response = await s3Client.send(
            new DeleteObjectCommand(deleteParams)
          );
          console.log(`Usunięto plik: ${fileKey}`);
          // Jeśli usunięto plik o podanej nazwie, to kończymy funkcję
          if (fileParts[fileParts.length - 1] === fileName) {
            return;
          }
        } catch (deleteErr) {
          console.error(`Błąd podczas usuwania pliku ${fileKey}:`, deleteErr);
        }
      }
    }
  } catch (err) {
    console.error("Błąd", err);
  }
};

const listFiles = async (options) => {
  let regexPattern = null;
  let showModifiedDate = false;
  let showSize = false;

  options.forEach((option, index) => {
    switch (option) {
      case "-rgx":
        if (options[index + 1]) {
          regexPattern = options[index + 1];
          console.log(regexPattern);
        } else {
          console.error("Nieprawidłowy format regexa");
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
  });

  try {
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

// listFiles(["-m"]);

program
  .command("list [options...]")
  .description("Wyświetla listę plików w buckecie")
  .option("-rgx <regex>", "Filtruje pliki za pomocą wyrażenia regularnego")
  .option("-m", "Wyświetla datę modyfikacji plików")
  .option("-s", "Wyświetla rozmiar plików")
  .action((command) => {
    const options = program.args;
    listFiles(options);
  });

program
  .command("upload <filePath>")
  .description("Przesyła plik do Bucketu")
  .option("-o, --overwrite", "Nadpisuje istniejący plik bez pytania")
  .action((filePath, options) => {
    console.log("Przekazana ścieżka do przesyłanego pliku:", filePath);
    const fullPath = path.resolve(filePath);
    console.log("Pełna ścieżka do przesyłanego pliku:", fullPath);
    uploadFile(fullPath, options);
  });

program
  .command("delete [options...]")
  .description("Usuwa pliki z Bucketu")
  .option("-rgx <regex>", "Usuwa pliki pasujące do wyrażenia regularnego")
  .action((command) => {
    const options = program.args;
    deleteFilesByRegex(options);
  });

program.parse(process.argv);
