import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JWTAuthGuard } from './guards/auth.guard';

@Module({
	controllers: [AuthController],
	providers: [
		AuthService,
		JwtService,
		RedisService,
		JwtStrategy,
		JWTAuthGuard,
	],
	imports: [
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: process.env.ACCESSTOKEN_LIFETIME },
		}),
		UserModule,
	],
})
export class AuthModule {}