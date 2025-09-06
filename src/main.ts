import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BadRequestException, ValidationPipe } from "@nestjs/common";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix("api");

    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          "http://localhost:8000",
          "http://localhost:4000",
          "http://localhost:3000",
          "https://maishiytech.uz",
          "https://api/StroySetka.uz",
          "https://stroy-setka.vercel.app",
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new BadRequestException("Not allowad by CORS"));
        }
      },
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true, // cookie va header
    });

    app.useGlobalPipes(new ValidationPipe());
    await app.listen(PORT, () => {
      console.log(`Server is started at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}
start();


//1550232639 Ristillakammi idlari
// 1766424473 maniki;
