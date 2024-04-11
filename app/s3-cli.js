const { Command } = require("commander");
const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const path = require("path");
const dotenv = require("dotenv");
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

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

const uploadFile = async (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

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

const listFiles = async (options) => {
  let regexPattern = null;
  let showModifiedDate = false;
  let showSize = false;

  options.forEach((option, index) => {
    switch (option) {
      case "-rgx":
        if (options[index + 1] && options[index + 1].startsWith("'")) {
          regexPattern = options[index + 1].slice(1, -1);
        } else {
          console.error("Nieprawidłowy format regexa.");
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

// listFiles("-m");

program
  .command("list [options...]")
  .description("Wyświetla listę plików w buckecie")
  .option("-rgx <regex>", "Filtruje pliki za pomocą wyrażenia regularnego")
  .option("-m", "Wyświetla datę modyfikacji plików")
  .option("-s", "Wyświetla rozmiar plików")
  .action((command) => {
    const options = program.args.slice(1);
    listFiles(options);
  });

program.parse(process.argv);
