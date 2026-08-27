import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
	});
	app.useGlobalFilters(new GlobalExceptionFilter());
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalInterceptors(new TimeoutInterceptor());

	await app.listen(3000);
}

bootstrap();