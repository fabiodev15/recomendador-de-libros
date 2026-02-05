import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Para desarrollo local
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para frontend en Vercel y localhost
  app.enableCors({
    origin: ['https://recomendador-de-libros-frontend.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  await app.listen(process.env.PORT ?? 3000);
}

// Solo ejecutar bootstrap si no estamos en Vercel
if (require.main === module) {
  bootstrap();
}

// Exportar para Vercel (serverless)
let cachedApp: any;

async function createNestServer() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: ['https://recomendador-de-libros-frontend.vercel.app', 'http://localhost:5173'],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
    }));

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// Handler para Vercel con manejo explícito de preflight
export default async (req: any, res: any) => {
  // Configurar headers CORS manualmente para asegurar compatibilidad con Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const app = await createNestServer();
  return app.getHttpAdapter().getInstance()(req, res);
};

