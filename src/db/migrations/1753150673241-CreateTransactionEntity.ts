import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionEntity1753148827462
  implements MigrationInterface
{
  name = 'CreateTransactionEntity1753148827462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transaction" (
        "id" SERIAL NOT NULL,
        "pluggyTransactionId" character varying NOT NULL,
        "description" character varying NOT NULL,
        "amount" numeric NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "type" character varying NOT NULL,
        "category" character varying,
        "accountId" character varying,
        "itemId" character varying NOT NULL,
        "userId" integer,
        CONSTRAINT "UQ_transaction_pluggy_id" UNIQUE ("pluggyTransactionId"),
        CONSTRAINT "PK_transaction_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "transaction"
      ADD CONSTRAINT "FK_transaction_user"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_user"
    `);

    await queryRunner.query(`
      DROP TABLE "transaction"
    `);
  }
}
