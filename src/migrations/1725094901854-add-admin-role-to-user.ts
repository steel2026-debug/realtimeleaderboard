import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminRoleToUser1725094901854 implements MigrationInterface {
    name = 'AddAdminRoleToUser1725094901854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "gameRating" integer DEFAULT 0, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b4e8e85a5b0a1f2e6f6b6c1a" UNIQUE ("name"), CONSTRAINT "PK_98aad69e8e3b0f4f6b1f3f6f3b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "score" ("id" SERIAL NOT NULL, "score" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "gameId" integer, CONSTRAINT "PK_7b0ddbb3c9f4f6c4e5c7a4c9e1b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "leaderboard" ("id" SERIAL NOT NULL, "gameId" integer, "userId" integer, "scoreId" integer, CONSTRAINT "PK_5f7a0d8c6e6b8a7f0a5e9d4b3c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "score" ADD CONSTRAINT "FK_score_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score" ADD CONSTRAINT "FK_score_game" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD CONSTRAINT "FK_leaderboard_game" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD CONSTRAINT "FK_leaderboard_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD CONSTRAINT "FK_leaderboard_score" FOREIGN KEY ("scoreId") REFERENCES "score"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD "admin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "admin"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT "FK_leaderboard_score"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT "FK_leaderboard_user"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT "FK_leaderboard_game"`);
        await queryRunner.query(`ALTER TABLE "score" DROP CONSTRAINT "FK_score_game"`);
        await queryRunner.query(`ALTER TABLE "score" DROP CONSTRAINT "FK_score_user"`);
        await queryRunner.query(`DROP TABLE "leaderboard"`);
        await queryRunner.query(`DROP TABLE "score"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
