import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tournament } from './entities/tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Game } from '../game/entities/game.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class TournamentService {
	constructor(
		@InjectRepository(Tournament)
		private readonly tournamentRepo: Repository<Tournament>,
		@InjectRepository(Game)
		private readonly gameRepo: Repository<Game>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	async create(createTournamentDto: CreateTournamentDto) {
		const { gameIds, ...tournamentData } = createTournamentDto;
		const games = await this.gameRepo.findBy({ id: In(gameIds) });
		if (games.length !== gameIds.length) {
			throw new NotFoundException('One or more games were not found');
		}
		const tournament = this.tournamentRepo.create({ ...tournamentData, games });
		return await this.tournamentRepo.save(tournament);
	}

	async join(tournamentId: number, userId: number) {
		const tournament = await this.tournamentRepo.findOne({
			where: { id: tournamentId },
			relations: ['participants'],
		});

		if (!tournament) {
			throw new NotFoundException('Tournament not found');
		}

		if (tournament.participants.length >= tournament.maxParticipants) {
			throw new Error('Tournament is full');
		}

		if (tournament.participants.some((participant) => participant.id === userId)) {
			throw new Error('User has already joined this tournament');
		}

		const user = await this.userRepo.findOneBy({ id: userId });
		if (!user) {
			throw new NotFoundException('User not found');
		}

		tournament.participants.push(user);
		return await this.tournamentRepo.save(tournament);
	}

	async findAll() {
		return await this.tournamentRepo.find({ relations: ['games', 'participants'] });
	}

	async findOne(id: number) {
		const tournament = await this.tournamentRepo.findOne({
			where: { id },
			relations: ['games', 'participants'],
		});
		if (!tournament) {
			throw new NotFoundException('Tournament not found');
		}
		return tournament;
	}

	async update(id: number, updateTournamentDto: UpdateTournamentDto) {
		const result = await this.tournamentRepo.update(
			id,
			updateTournamentDto,
		);
		if (!result.affected) {
			throw new NotFoundException('Tournament not found');
		}
		return await this.tournamentRepo.findOne({ where: { id } });
	}

	async remove(id: number) {
		const tournament = await this.tournamentRepo.findOne({
			where: { id },
		});
		if (!tournament) {
			throw new NotFoundException('Tournament not found');
		}
		await this.tournamentRepo.delete(id);
		return 'tournament removed';
	}
}
