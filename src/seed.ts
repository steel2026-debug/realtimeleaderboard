import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from './user/entities/user.entity';
import { Game } from './game/entities/game.entity';
import { Score } from './score/entities/score.entity';
import { Leaderboard } from './leaderboard/entities/leaderboard.entity';
import { FriendRequest } from './user/entities/friend-request.entity';
import { Message } from './user/entities/message.entity';
import { Tournament } from './tournament/entities/tournament.entity';
import Redis from 'ioredis';

const demoPassword = 'DemoPass123!';

async function seed() {
	await AppDataSource.initialize();

	const userRepo = AppDataSource.getRepository(User);
	const gameRepo = AppDataSource.getRepository(Game);
	const scoreRepo = AppDataSource.getRepository(Score);
	const leaderboardRepo = AppDataSource.getRepository(Leaderboard);
	const friendRequestRepo = AppDataSource.getRepository(FriendRequest);
	const messageRepo = AppDataSource.getRepository(Message);
	const tournamentRepo = AppDataSource.getRepository(Tournament);
	const password = await bcrypt.hash(demoPassword, 10);

	const userSeeds = [
		{ username: 'VishuKaneki', email: 'vishalniranjan710@gmail.com', admin: true },
		{ username: 'NovaByte', email: 'nova@example.com', admin: false },
		{ username: 'PixelSage', email: 'pixel@example.com', admin: false },
		{ username: 'RiftRunner', email: 'rift@example.com', admin: false },
		{ username: 'LunaLogic', email: 'luna@example.com', admin: false },
		{ username: 'ByteKnight', email: 'byte@example.com', admin: false },
	];
	const users: User[] = [];
	for (const seedUser of userSeeds) {
		let user = await userRepo.findOneBy({ email: seedUser.email });
		if (!user) {
			user = await userRepo.save(userRepo.create({ ...seedUser, password }));
		}
		users.push(user);
	}

	const gameSeeds = [
		{ name: 'Neon Sprint', description: 'Velocity under pressure', gameRating: 5 },
		{ name: 'Orbital Clash', description: 'Tactical combat in zero gravity', gameRating: 5 },
		{ name: 'Pixel Rivals', description: 'Classic arcade, modern stakes', gameRating: 5 },
	];
	const games: Game[] = [];
	for (const seedGame of gameSeeds) {
		let game = await gameRepo.findOneBy({ name: seedGame.name });
		if (!game) game = await gameRepo.save(gameRepo.create(seedGame));
		games.push(game);
	}

	let scores = await scoreRepo.find({ relations: ['user', 'game'] });
	if (scores.length === 0) {
		const scoreSeeds = [
			[0, 9820, 0], [1, 9140, 0], [2, 8760, 0], [3, 8410, 0],
			[2, 12600, 1], [0, 11800, 1], [4, 10950, 1], [5, 10100, 1],
			[1, 15300, 2], [3, 14750, 2], [0, 13900, 2], [4, 13100, 2],
		];
		scores = await scoreRepo.save(scoreSeeds.map(([userIndex, value, gameIndex]) => scoreRepo.create({
			score: value,
			user: users[userIndex],
			game: games[gameIndex],
		})));
	}

	if ((await leaderboardRepo.count()) === 0) {
		for (const game of games) {
			const topScore = scores.filter((score) => score.game.id === game.id).sort((a, b) => b.score - a.score)[0];
			if (topScore) await leaderboardRepo.save(leaderboardRepo.create({ game, user: topScore.user, score: topScore }));
		}
	}

	const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379, password: process.env.REDIS_PASSWORD || undefined });
	for (const score of scores) {
		await redis.zadd(`leaderboard:game: ${score.game.name}`, score.score, `user:${score.user.username}`);
	}

	if ((await friendRequestRepo.count()) === 0) {
		await friendRequestRepo.save(friendRequestRepo.create({ sender: users[0], receiver: users[1], status: 'accepted' }));
		await friendRequestRepo.save(friendRequestRepo.create({ sender: users[2], receiver: users[0], status: 'pending' }));
	}
	if ((await messageRepo.count()) === 0) {
		await messageRepo.save(messageRepo.create({ sender: users[0], receiver: users[1], content: 'Ready for the next run?', read: true }));
		await messageRepo.save(messageRepo.create({ sender: users[1], receiver: users[0], content: 'Always. Queue it up.', read: false }));
	}
	if ((await tournamentRepo.count()) === 0) {
		const tournament = tournamentRepo.create({
			name: 'Friday Night Finals',
			startDate: new Date('2026-08-28T19:00:00Z'),
			endDate: new Date('2026-08-28T22:00:00Z'),
			maxParticipants: 32,
			games: [games[0], games[2]],
			participants: [users[0], users[1], users[2]],
		});
		await tournamentRepo.save(tournament);
	}

	await redis.quit();
	await AppDataSource.destroy();
	console.log('Seed complete. Demo password for new users:', demoPassword);
	console.log('Demo users:', userSeeds.map(({ username, email }) => `${username} <${email}>`).join(', '));
}

seed().catch(async (error) => {
	console.error('Seed failed:', error);
	if (AppDataSource.isInitialized) await AppDataSource.destroy();
	process.exitCode = 1;
});
