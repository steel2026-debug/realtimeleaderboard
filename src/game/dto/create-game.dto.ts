import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateGameDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsOptional()
	description: string;
}