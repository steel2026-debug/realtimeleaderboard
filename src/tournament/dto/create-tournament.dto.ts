import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTournamentDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsDate()
	@Type(() => Date)
	startDate: Date;

	@IsDate()
	@Type(() => Date)
	endDate: Date;

	@IsNumber()
	@Type(() => Number)
	maxParticipants: number;

	@IsArray()
	@IsInt({ each: true })
	@Type(() => Number)
	gameIds: number[];
}
