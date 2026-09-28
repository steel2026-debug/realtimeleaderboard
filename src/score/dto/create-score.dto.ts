import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateScoreDto {
	@IsNumber()
	@IsNotEmpty()
	score: number;
}