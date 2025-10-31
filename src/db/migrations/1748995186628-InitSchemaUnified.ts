import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchemaUnified1748995186628 implements MigrationInterface {
  name = 'InitSchemaUnified1748995186628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criação das tabelas principais
    await queryRunner.query(`
            CREATE TABLE "income" (
                "id" SERIAL NOT NULL,
                "description" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date,
                "userId" integer,
                "categoryId" integer,
                CONSTRAINT "PK_3c7d78e8cf6c15bc5c6f9b87a43" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "user_income_allocation" (
                "id" SERIAL NOT NULL,
                "expensesPercentage" numeric(5,2) NOT NULL,
                "leisurePercentage" numeric(5,2) NOT NULL,
                "investmentsPercentage" numeric(5,2) NOT NULL,
                "fixedSalary" numeric(10,2) NOT NULL,
                "extraIncome" numeric(10,2) NOT NULL DEFAULT '0',
                "totalMonthlyIncome" numeric(10,2) NOT NULL,
                "investmentsAmount" numeric(10,2) NOT NULL,
                "expensesAmount" numeric(10,2) NOT NULL,
                "leisureAmount" numeric(10,2) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer,
                CONSTRAINT "PK_76dec14d95ded1e276395e7f317" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "firebase_uuid" character varying NOT NULL,
                "name" character varying(50) NOT NULL,
                "email" character varying(50) NOT NULL,
                CONSTRAINT "UQ_3308ac87fc24fc559cd6951c916" UNIQUE ("firebase_uuid"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "expense" (
                "id" SERIAL NOT NULL,
                "description" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "date" TIMESTAMP NOT NULL,
                "userId" integer,
                "categoryId" integer,
                CONSTRAINT "PK_edd925b450e13ea36197c9590fc" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "category" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")
            )
        `);

    // Relacionamentos (foreign keys) - usando os nomes atualizados da UpdateUserIncomeAllocationEntity
    await queryRunner.query(`
            ALTER TABLE "income"
            ADD CONSTRAINT "FK_0965fe0d5faa3b2e7518d7bb244"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "income"
            ADD CONSTRAINT "FK_977569f13a51a1ec583765daffd"
            FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "user_income_allocation"
            ADD CONSTRAINT "FK_161b56dc169c418d05b79074c9e"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "expense"
            ADD CONSTRAINT "FK_06e076479515578ab1933ab4375"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "expense"
            ADD CONSTRAINT "FK_42eea5debc63f4d1bf89881c10a"
            FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expense" DROP CONSTRAINT "FK_42eea5debc63f4d1bf89881c10a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense" DROP CONSTRAINT "FK_06e076479515578ab1933ab4375"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_income_allocation" DROP CONSTRAINT "FK_161b56dc169c418d05b79074c9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" DROP CONSTRAINT "FK_977569f13a51a1ec583765daffd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "income" DROP CONSTRAINT "FK_0965fe0d5faa3b2e7518d7bb244"`,
    );

    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "expense"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_income_allocation"`);
    await queryRunner.query(`DROP TABLE "income"`);
  }
}
