import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { ResponseUtil } from '../common/utils/response.util';
import { BadRequestException } from '../common/exceptions/application.exceptions';
import { JWTAuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@UseGuards(JWTAuthGuard)
@Controller('tournament')
export class TournamentController {
	constructor(private readonly tournamentService: TournamentService) {}

	@UseGuards(AdminGuard)
	@Post()
	async create(@Body() createTournamentDto: CreateTournamentDto) {
		try {
			const tournament =
				await this.tournamentService.create(createTournamentDto);
			return ResponseUtil.success(
				tournament,
				'Tournament created successfully',
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Post(':id/join')
	async join(@Param('id') id: number, @CurrentUser() user: User) {
		try {
			const tournament = await this.tournamentService.join(id, user.id);
			return ResponseUtil.success(
				tournament,
				'User joined tournament successfully',
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Get()
	async findAll() {
		try {
			const tournaments = await this.tournamentService.findAll();
			return ResponseUtil.success(
				tournaments,
				'Tournaments retrieved successfully',
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Get(':id')
	async findOne(@Param('id') id: number) {
		try {
			const tournament = await this.tournamentService.findOne(id);
			return ResponseUtil.success(
				tournament,
				'Tournament retrieved successfully',
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Patch(':id')
	@UseGuards(AdminGuard)
	async update(
		@Param('id') id: number,
		@Body() updateTournamentDto: UpdateTournamentDto,
	) {
		try {
			const tournament = await this.tournamentService.update(
				id,
				updateTournamentDto,
			);
			return ResponseUtil.success(
				tournament,
				'Tournament updated successfully',
			);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Delete(':id')
	@UseGuards(AdminGuard)
	async remove(@Param('id') id: number) {
		try {
			const result = await this.tournamentService.remove(id);
			return ResponseUtil.success(result, 'Tournament deleted successfully');
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}
